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
  uniform float uBlurStrength;

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
    return (uv - 0.5) * scale + 0.5;
  }

  void main() {
    vec2 uv = vUv;

    // Parallaxe simple basée sur la position de la souris
    vec2 parallaxOffset = (uMouse - 0.5) * uParallaxStrength;
    uv -= parallaxOffset;

    // Blur gaussien 9x9
    vec3 col   = vec3(0.0);
    float total = 0.0;
    float b     = uBlurStrength / uResolution.x;

    for (int x = -4; x <= 4; x++) {
      for (int y = -4; y <= 4; y++) {
        vec2 off = vec2(float(x), float(y)) * b;
        float w  = exp(-float(x * x + y * y) * 0.15);
        vec2 sampleUV = getCoverUV(clamp(uv + off, 0.0, 1.0), uTextureSize);
        col   += texture2D(uTexture, sampleUV).rgb * w;
        total += w;
      }
    }

    gl_FragColor = vec4(col / total, 1.0);
  }
`;
