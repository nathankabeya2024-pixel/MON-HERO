import * as THREE from "three";
import { vertexShader, fragmentShader } from "./shaders";

const config = {
  lerpFactor: 0.035,
  parallaxStrength: 0.1,
  distortionMultiplier: 10,
  glassStrength: 2.0,
  glassSmoothness: 0.0001,
  stripesFrequency: 35,
  edgePadding: 0.1,
};

const container = document.querySelector(".hero");
const imageElement = document.getElementById("glassTexture");

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const mouse = { x: 0.5, y: 0.5 };
const targetMouse = { x: 0.5, y: 0.5 };

const lerp = (start, end, factor) => start + (end - start) * factor;

const textureSize = { x: 1, y: 1 };
const material = new THREE.ShaderMaterial({
  uniforms: {
    uTexture: { value: null },
    uResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
    uTextureSize: {
      value: new THREE.Vector2(textureSize.x, textureSize.y),
    },
    uMouse: { value: new THREE.Vector2(mouse.x, mouse.y) },
    uParallaxStrength: { value: config.parallaxStrength },
    uDistortionMultiplier: { value: config.distortionMultiplier },
    uGlassStrength: { value: config.glassStrength },
    ustripesFrequency: { value: config.stripesFrequency },
    uglassSmoothness: { value: config.glassSmoothness },
    uEdgePadding: { value: config.edgePadding },
  },
  vertexShader,
  fragmentShader,
});

const geometry = new THREE.PlaneGeometry(2, 2);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

function loadImageFromElement() {
  if (!imageElement.complete) {
    imageElement.onload = loadImageFromElement;
    return;
  }

  const texture = new THREE.Texture(imageElement);
  textureSize.x = imageElement.naturalWidth || imageElement.width;
  textureSize.y = imageElement.naturalHeight || imageElement.height;

  texture.needsUpdate = true;
  material.uniforms.uTexture.value = texture;
  material.uniforms.uTextureSize.value.set(textureSize.x, textureSize.y);
}

if (imageElement.complete) {
  loadImageFromElement();
} else {
  imageElement.onload = loadImageFromElement;
}

window.addEventListener("mousemove", (e) => {
  targetMouse.x = e.clientX / window.innerWidth;
  targetMouse.y = 1.0 - e.clientY / window.innerHeight;
});

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  material.uniforms.uResolution.value.set(
    window.innerWidth,
    window.innerHeight
  );
});

function animate() {
  requestAnimationFrame(animate);

  mouse.x = lerp(mouse.x, targetMouse.x, config.lerpFactor);
  mouse.y = lerp(mouse.y, targetMouse.y, config.lerpFactor);
  material.uniforms.uMouse.value.set(mouse.x, mouse.y);

  renderer.render(scene, camera);
}

animate();
