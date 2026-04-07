import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { vertexShader, fragmentShader } from "/shaders.js";

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

/* ── Utilise les dimensions du conteneur, pas de la fenêtre ── */
function getSize() {
  return {
    w: container.clientWidth,
    h: container.clientHeight,
  };
}

const { w, h } = getSize();
renderer.setSize(w, h);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

/* ── Canvas en cover absolu dans .hero ── */
renderer.domElement.style.position = "absolute";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.width = "100%";
renderer.domElement.style.height = "100%";

const mouse = { x: 0.5, y: 0.5 };
const targetMouse = { x: 0.5, y: 0.5 };
const lerp = (start, end, factor) => start + (end - start) * factor;
const textureSize = { x: 1, y: 1 };

const material = new THREE.ShaderMaterial({
  uniforms: {
    uTexture: { value: null },
    uResolution: { value: new THREE.Vector2(w, h) },
    uTextureSize: { value: new THREE.Vector2(textureSize.x, textureSize.y) },
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

/* ── Souris relative au conteneur ── */
container.addEventListener("mousemove", (e) => {
  const rect = container.getBoundingClientRect();
  targetMouse.x = (e.clientX - rect.left) / rect.width;
  targetMouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
});

/* ── Resize basé sur le conteneur ── */
window.addEventListener("resize", () => {
  const { w, h } = getSize();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  material.uniforms.uResolution.value.set(w, h);
});

function animate() {
  requestAnimationFrame(animate);
  mouse.x = lerp(mouse.x, targetMouse.x, config.lerpFactor);
  mouse.y = lerp(mouse.y, targetMouse.y, config.lerpFactor);
  material.uniforms.uMouse.value.set(mouse.x, mouse.y);
  renderer.render(scene, camera);
}

animate();
