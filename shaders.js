export const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
export const fragmentShader = `
  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform vec2 uTextureSize;
  uniform vec2 uMouse;
  uniform float uParallaxStrength;
  uniform float uDistortionMultiplier;
  uniform float uGlassStrength;
  uniform float ustripesFrequency;
  uniform float uglassSmoothness;
  uniform float uEdgePadding;
  varying vec2 vUv;
  vec2 getCoverUV(vec2 uv, vec2 textureSize) {
    if (textureSize.x < 1.0 || textureSize.y < 1.0) return uv;
    float texAspect    = textureSize.x / textureSize.y;
    float screenAspect = uResolution.x / uResolution.y;
    vec2 scale;
    if (screenAspect > texAspect) {
      scale = vec2(1.0, texAspect / screenAspect);
    } else {
      scale = vec2(screenAspect / texAspect, 1.0);
    }
    scale *= 1.3;
    return (uv - 0.5) * scale + 0.5;
  }
  float displacement(float x, float num_stripes, float strength) {
    float modulus = 1.0 / num_stripes;
    return mod(x, modulus) * strength;
  }
  float fractalGlass(float x) {
    float d = 0.0;
    for (int i = -5; i <= 5; i++) {
      d += displacement(x + float(i) * uglassSmoothness, ustripesFrequency, uGlassStrength);
    }
    return x + d / 11.0;
  }
  float smoothEdge(float x, float padding) {
    if (x < padding) return smoothstep(0.0, padding, x);
    if (x > 1.0 - padding) return smoothstep(1.0, 1.0 - padding, x);
    return 1.0;
  }
  void main() {
    vec2 uv = vUv;
    float originalX = uv.x;
    float edgeFactor = smoothEdge(originalX, uEdgePadding);
    float distortedX = fractalGlass(originalX);
    uv.x = mix(originalX, distortedX, edgeFactor);
    float distortionFactor = uv.x - originalX;
    float parallaxDirection = -sign(0.5 - uMouse.x);
    vec2 parallaxOffset = vec2(
      parallaxDirection * abs(uMouse.x - 0.5) * uParallaxStrength * (1.0 + abs(distortionFactor) * uDistortionMultiplier),
      0.0
    );
    parallaxOffset *= edgeFactor;
    uv += parallaxOffset;
    vec2 coverUV = getCoverUV(uv, uTextureSize);
    coverUV = clamp(coverUV, 0.0, 1.0);
    gl_FragColor = texture2D(uTexture, coverUV);
  }
`;
