import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { vertexShader, fragmentShader } from "/shaders.js";

const config = {
  lerpFactor:        0.035,
  parallaxStrength:  0.1,
  blurStrength:      16.0,  // intensité du blur
  snowFadeSpeed:     0.05,  // vitesse de disparition de la neige
};

const container    = document.querySelector(".hero");
const imageElement = document.getElementById("glassTexture");

const scene    = new THREE.Scene();
const camera   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const renderer = new THREE.WebGLRenderer({ antialias: true });

function W() { return container.clientWidth; }
function H() { return container.clientHeight; }

renderer.setSize(W(), H());
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const cvs = renderer.domElement;
cvs.style.position = "absolute";
cvs.style.top      = "0";
cvs.style.left     = "0";
cvs.style.width    = "100%";
cvs.style.height   = "100%";
cvs.style.display  = "block";

const mouse       = { x: 0.5, y: 0.5 };
const targetMouse = { x: 0.5, y: 0.5 };
const lerp = (a, b, t) => a + (b - a) * t;

const material = new THREE.ShaderMaterial({
  uniforms: {
    uTexture:          { value: null },
    uResolution:       { value: new THREE.Vector2(W(), H()) },
    uTextureSize:      { value: new THREE.Vector2(1, 1) },
    uMouse:            { value: new THREE.Vector2(0.5, 0.5) },
    uParallaxStrength: { value: config.parallaxStrength },
    uBlurStrength:     { value: config.blurStrength },
    uSnowIntensity:    { value: 0.0 },
    uTime:             { value: 0.0 },
  },
  vertexShader,
  fragmentShader,
});

const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
scene.add(mesh);

function loadImageFromElement() {
  if (!imageElement.complete) { imageElement.onload = loadImageFromElement; return; }
  const texture = new THREE.Texture(imageElement);
  texture.needsUpdate = true;
  material.uniforms.uTexture.value = texture;
  material.uniforms.uTextureSize.value.set(
    imageElement.naturalWidth  || imageElement.width,
    imageElement.naturalHeight || imageElement.height
  );
}
imageElement.complete ? loadImageFromElement() : (imageElement.onload = loadImageFromElement);

// Neige au mouvement de souris
let snowTimeout;
let targetSnow = 0.0;

container.addEventListener("mousemove", (e) => {
  const rect = container.getBoundingClientRect();
  targetMouse.x = (e.clientX - rect.left) / rect.width;
  targetMouse.y = 1.0 - (e.clientY - rect.top) / rect.height;

  targetSnow = 1.0;
  clearTimeout(snowTimeout);
  snowTimeout = setTimeout(() => { targetSnow = 0.0; }, 300);
});

window.addEventListener("resize", () => {
  renderer.setSize(W(), H());
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  material.uniforms.uResolution.value.set(W(), H());
});

function animate() {
  requestAnimationFrame(animate);

  mouse.x = lerp(mouse.x, targetMouse.x, config.lerpFactor);
  mouse.y = lerp(mouse.y, targetMouse.y, config.lerpFactor);
  material.uniforms.uMouse.value.set(mouse.x, mouse.y);

  // Fondu progressif de la neige
  const snow = material.uniforms.uSnowIntensity.value;
  material.uniforms.uSnowIntensity.value = lerp(snow, targetSnow, config.snowFadeSpeed);

  material.uniforms.uTime.value += 0.016;

  renderer.render(scene, camera);
}
animate();
