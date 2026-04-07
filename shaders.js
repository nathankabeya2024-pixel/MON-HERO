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
  uniform float uSnowIntensity;
  uniform float uTime;
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

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float snow(vec2 uv, float scale, float speed) {
    vec2 grid = uv * scale;
    grid.y += uTime * speed;
    grid.x += sin(uTime * 0.3 + floor(grid.y)) * 0.3;
    vec2 cell = floor(grid);
    vec2 local = fract(grid) - 0.5;
    float offset = hash(cell) * 0.4;
    local.x += offset - 0.2;
    float r = hash(cell + vec2(3.7, 8.1)) * 0.04 + 0.01;
    float dist = length(local);
    return smoothstep(r, r * 0.3, dist);
  }

  void main() {
    vec2 uv = vUv;

    // Parallaxe au survol
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
    col /= total;

    // Effet neige (s'active avec uSnowIntensity)
    float s = 0.0;
    s += snow(vUv, 20.0, 0.4) * 0.6;
    s += snow(vUv, 35.0, 0.7) * 0.4;
    s += snow(vUv, 55.0, 1.1) * 0.3;
    s += snow(vUv, 80.0, 1.6) * 0.2;
    col = mix(col, vec3(1.0), s * uSnowIntensity);

    gl_FragColor = vec4(col, 1.0);
  }
`;
