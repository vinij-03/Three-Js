import { Controller } from "./controls";
import THREE from "three";
import { Scene, Color, PerspectiveCamera, WebGLRenderer, AnimationMixer } from "three";
import { DirectionalLight, AmbientLight, Clock, AxesHelper } from "three";
import { OrbitControls } from "@three-ts/orbit-controls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import "./styles.css";
// import * as CANNON from "cannon-es";

const scene = new Scene();
scene.background = new Color(0xa8def0);
const axesHelper = new AxesHelper(100);
scene.add(axesHelper);

const camera = new PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(10,15, 10);

const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.minDistance =10;
orbit.enableDamping = true;
orbit.maxDistance = 30 ;
orbit.enablePan = false;
orbit.maxPolarAngle = Math.PI / 2 - 0.05;
orbit.update();

light();

// //physics
// const world = new CANNON.World();
// world.broadphase = new CANNON.SAPBroadphase(world);
// world.allowSleep = true;
// world.gravity.set(0, -9.82, 0);

// const defaultMaterial = new CANNON.Material("default");
// const defaultContactMaterial = new CANNON.ContactMaterial(
//   defaultMaterial,
//   defaultMaterial,
//   {
//     friction: 0.1,
//     restitution: 0.5,
//   }
// );
// world.defaultContactMaterial = defaultContactMaterial;

var characterControls: Controller;
new GLTFLoader().load(
  "SFL.glb",
  function (gltf) {
    const model = gltf.scene;
    model.traverse(function (object: any) {
      if (object.isMesh) object.castShadow = true;
    });
    scene.add(model);
  }
);
new GLTFLoader().load(
  "Soldier.glb",
  function (gltf) {
    const model = gltf.scene;
    model.traverse(function (object: any) {
      if (object.isMesh) object.castShadow = true;
    });
    gltf.scene.scale.set(5,5,5),
    scene.add(model);

    const gltfAnimations: THREE.AnimationClip[] = gltf.animations;
    const mixer = new AnimationMixer(model);
    const animationsMap: Map<string, THREE.AnimationAction> = new Map();
    gltfAnimations
      .filter((a) => a.name != "TPose")
      .forEach((a: THREE.AnimationClip) => {
        animationsMap.set(a.name, mixer.clipAction(a));
      });

    characterControls = new Controller(
      model,
      mixer,
      animationsMap,
      orbit as any,
      camera,
      "Idle"
    );
    model.position.set(0,-1,0)
  }
);


const keysPressed = {};
document.addEventListener(
  "keydown",
  (event) => {
    if (event.shiftKey && characterControls) {
      characterControls.switchRunToggle();
    } else {
      (keysPressed as any)[event.key.toLowerCase()] = true;
    }
  },
  false
);
document.addEventListener(
  "keyup",
  (event) => {
    (keysPressed as any)[event.key.toLowerCase()] = false;
  },
  false
);

const clock = new Clock();

function animate() {
  let mixerUpdateDelta = clock.getDelta();
  if (characterControls) {
    characterControls.update(mixerUpdateDelta, keysPressed);
  }
  orbit.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
document.body.appendChild(renderer.domElement);
animate();

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onWindowResize);

function light() {
  scene.add(new AmbientLight(0xffffff, 0.7));

  const dirLight = new DirectionalLight(0xffffff, 1);
  dirLight.position.set(-60, 100, -10);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 50;
  dirLight.shadow.camera.bottom = -50;
  dirLight.shadow.camera.left = -50;
  dirLight.shadow.camera.right = 50;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 200;
  dirLight.shadow.mapSize.width = 4096;
  dirLight.shadow.mapSize.height = 4096;
  scene.add(dirLight);
}
