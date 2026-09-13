/**
 * Three.js 3D Preview Manager
 * High-fidelity 3D studio with calibrated soft shadows, contact shadows,
 * dynamic bump mapping, multiple geometries, and customizable material controls.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { getAssetPath } from '../utils/helpers.js';

export class ThreePreview {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container ${containerId} not found`);
      return;
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.mesh = null;
    this.texture = null;
    this.bumpTexture = null;
    this.animationId = null;
    this.currentMode = 'sphere';

    // Studio stage & shadow elements
    this.shadowPlane = null;
    this.contactShadow = null;
    this.studioLights = {};

    // Animation & Turntable
    this.autoRotate = true;
    this.autoRotateSpeed = 0.005;

    // Material parameters
    this.materialSettings = {
      roughness: 0.45,
      metalness: 0.05,
      bumpScale: 0.03,
      clearcoat: 0.1,
    };

    // Current lighting preset ('studio', 'warm', 'moody', 'highkey')
    this.lightingPreset = 'studio';

    // Logical tiling steps
    this.tileSteps = { widthSteps: 16, heightSteps: 16 };

    // Last loaded image element or data URL for bump generation
    this.rawImage = null;

    this.init();
  }

  init() {
    // 1. Scene setup
    this.scene = new THREE.Scene();

    // 2. Camera setup with realistic perspective
    const width = this.container.clientWidth || (window.innerWidth - 350);
    const height = this.container.clientHeight || window.innerHeight;
    const aspect = (width > 0 && height > 0) ? width / height : 1.6;

    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 1000);
    this.camera.position.set(3.4, 2.2, 4.8);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer setup with fallback
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
    } catch (e1) {
      console.warn('WebGL with antialias failed, falling back:', e1);
      this.renderer = new THREE.WebGLRenderer({ alpha: true });
    }

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // Enable PCF Soft Shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Modern color management
    if (this.renderer.outputColorSpace !== undefined) {
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // Clear any previous children in container
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this.container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls with smooth damping
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 25;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05;
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    // Automatically disable auto-rotate when user drags to interact with model
    this._disableAutoRotateOnDrag = () => {
      if (this.autoRotate) {
        this.toggleAutoRotate(false);
        if (typeof this.onAutoRotateChange === 'function') {
          this.onAutoRotateChange(false);
        }
      }
    };

    this.controls.addEventListener('start', this._disableAutoRotateOnDrag);
    this._pointerMoveHandler = (e) => {
      if (e.buttons > 0 && this.autoRotate) {
        this._disableAutoRotateOnDrag();
      }
    };
    this.renderer.domElement.addEventListener('pointermove', this._pointerMoveHandler);

    // 5. Lighting rig
    this.setupLighting();

    // 6. Setup shadow catcher & contact shadows
    this.setupShadowCatcher();

    // 7. Initial Mesh (Created immediately so viewport is never blank)
    this.createSphere();

    // 8. Load studio environment if available (safe asynchronous)
    this.loadEnvironmentIfAvailable();

    // 9. Window resize listener
    this._resizeHandler = () => this.onWindowResize();
    window.addEventListener('resize', this._resizeHandler);

    // Also trigger resize check after layout settles
    setTimeout(() => this.onWindowResize(), 100);

    // 10. Start animation loop
    this.animate();
  }

  loadEnvironmentIfAvailable() {
    try {
      const tryHdr = getAssetPath('assets/env/studio.hdr');
      new RGBELoader().load(
        tryHdr,
        (hdrTex) => {
          try {
            const pmrem = new THREE.PMREMGenerator(this.renderer);
            pmrem.compileEquirectangularShader();
            hdrTex.mapping = THREE.EquirectangularReflectionMapping;

            const envMap = pmrem.fromEquirectangular(hdrTex).texture;
            this.scene.environment = envMap;
            pmrem.dispose();
          } catch (e) {
            console.warn('PMREM failed:', e);
          }
        },
        undefined,
        (err) => {
          console.warn('HDR environment not available, using studio lighting:', err);
        }
      );
    } catch (e) {
      console.warn('RGBELoader failed to initialize:', e);
    }
  }

  setupLighting() {
    // Clean existing lights if any
    Object.values(this.studioLights).forEach((l) => {
      if (l && l.parent) this.scene.remove(l);
    });

    // 1. Hemisphere Light (Studio ambient sky + soft grayish white ground bounce)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd0d7de, 0.85);
    this.scene.add(hemiLight);
    this.studioLights.hemi = hemiLight;

    // 2. Key Light (Main soft shadow caster)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.85);
    keyLight.position.set(4.5, 7.5, 4.5);
    keyLight.castShadow = true;

    // Shadow Map Settings
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;

    const d = 5.0;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 22;

    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.normalBias = 0.025;
    keyLight.shadow.radius = 2.8;

    keyLight.target.position.set(0, 0, 0);
    this.scene.add(keyLight.target);
    this.scene.add(keyLight);
    this.studioLights.key = keyLight;

    // 3. Fill Light (Soft cool diffuse fill)
    const fillLight = new THREE.DirectionalLight(0xa6c8ff, 0.7);
    fillLight.position.set(-5, 3.5, -2);
    fillLight.castShadow = false;
    this.scene.add(fillLight);
    this.studioLights.fill = fillLight;

    // 4. Rim Light (Warm accent edge light)
    const rimLight = new THREE.DirectionalLight(0xffeedd, 0.8);
    rimLight.position.set(-1.5, 5.5, -5.5);
    rimLight.castShadow = false;
    this.scene.add(rimLight);
    this.studioLights.rim = rimLight;

    // 5. Soft Under-bounce Light
    const bounceLight = new THREE.DirectionalLight(0x8fa8d6, 0.35);
    bounceLight.position.set(0, -5, 2);
    bounceLight.castShadow = false;
    this.scene.add(bounceLight);
    this.studioLights.bounce = bounceLight;
  }

  setLightingPreset(preset) {
    this.lightingPreset = preset;
    const { key, fill, rim, hemi } = this.studioLights;
    if (!key || !fill || !rim || !hemi) return;

    switch (preset) {
    case 'warm':
      hemi.color.setHex(0xffecd2);
      hemi.groundColor.setHex(0x2a1b14);
      key.color.setHex(0xffecc4);
      key.intensity = 2.2;
      fill.color.setHex(0xffaf7a);
      fill.intensity = 0.6;
      rim.color.setHex(0xffd599);
      rim.intensity = 1.0;
      this.renderer.toneMappingExposure = 1.2;
      break;

    case 'moody':
      hemi.color.setHex(0x667799);
      hemi.groundColor.setHex(0x0a0e17);
      hemi.intensity = 0.4;
      key.color.setHex(0xffffff);
      key.intensity = 2.6;
      fill.color.setHex(0x38bdf8);
      fill.intensity = 0.8;
      rim.color.setHex(0x818cf8);
      rim.intensity = 1.6;
      this.renderer.toneMappingExposure = 1.05;
      break;

    case 'highkey':
      hemi.color.setHex(0xffffff);
      hemi.groundColor.setHex(0x94a3b8);
      hemi.intensity = 1.1;
      key.color.setHex(0xffffff);
      key.intensity = 1.6;
      fill.color.setHex(0xf1f5f9);
      fill.intensity = 0.9;
      rim.color.setHex(0xffffff);
      rim.intensity = 0.6;
      this.renderer.toneMappingExposure = 1.25;
      break;

    case 'studio':
    default:
      hemi.color.setHex(0xffffff);
      hemi.groundColor.setHex(0x1e2638);
      hemi.intensity = 0.75;
      key.color.setHex(0xffffff);
      key.intensity = 2.0;
      fill.color.setHex(0xa6c8ff);
      fill.intensity = 0.7;
      rim.color.setHex(0xffeedd);
      rim.intensity = 0.8;
      this.renderer.toneMappingExposure = 1.15;
      break;
    }
  }

  setupShadowCatcher() {
    if (this.shadowPlane) {
      this.scene.remove(this.shadowPlane);
      this.shadowPlane.geometry.dispose();
      this.shadowPlane.material.dispose();
    }
    if (this.contactShadow) {
      this.scene.remove(this.contactShadow);
      this.contactShadow.geometry.dispose();
      this.contactShadow.material.dispose();
    }

    // 1. Dynamic Directional Shadow Catcher Plane
    const shadowGeo = new THREE.PlaneGeometry(30, 30);
    const shadowMat = new THREE.ShadowMaterial({
      opacity: 0.22,
      transparent: true,
      depthWrite: false,
    });
    this.shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.y = -1.45;
    this.shadowPlane.receiveShadow = true;
    this.shadowPlane.name = 'studioShadowPlane';
    this.scene.add(this.shadowPlane);

    // 2. High-quality Contact Shadow Disc
    const contactTexture = this.generateContactShadowTexture();
    const contactGeo = new THREE.PlaneGeometry(4.2, 4.2);
    const contactMat = new THREE.MeshBasicMaterial({
      map: contactTexture,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.contactShadow = new THREE.Mesh(contactGeo, contactMat);
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.y = -1.44;
    this.contactShadow.name = 'studioContactShadow';
    this.scene.add(this.contactShadow);
  }

  generateContactShadowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    grad.addColorStop(0.25, 'rgba(0, 0, 0, 0.65)');
    grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.22)');
    grad.addColorStop(0.85, 'rgba(0, 0, 0, 0.04)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  generateBumpMapFromImage(imgElement) {
    if (!imgElement) return null;
    try {
      const canvas = document.createElement('canvas');
      const w = Math.min(imgElement.naturalWidth || imgElement.width || 512, 1024);
      const h = Math.min(imgElement.naturalHeight || imgElement.height || 512, 1024);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgElement, 0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = lum;
        data[i + 1] = lum;
        data[i + 2] = lum;
      }
      ctx.putImageData(imgData, 0, 0);

      const bumpTex = new THREE.CanvasTexture(canvas);
      bumpTex.wrapS = THREE.RepeatWrapping;
      bumpTex.wrapT = THREE.RepeatWrapping;
      return bumpTex;
    } catch (e) {
      console.warn('Could not generate bump map:', e);
      return null;
    }
  }

  getStandardMaterial() {
    return new THREE.MeshStandardMaterial({
      color: this.texture ? 0xffffff : 0x38bdf8,
      map: this.texture || null,
      bumpMap: this.bumpTexture || null,
      bumpScale: this.materialSettings.bumpScale,
      roughness: this.materialSettings.roughness,
      metalness: this.materialSettings.metalness,
      envMapIntensity: 0.75,
    });
  }

  // --- Geometries ---

  createPlane() {
    this.cleanMesh();
    this.toggleStudioShadows(true);

    const geometry = new THREE.PlaneGeometry(3.0, 3.0, 32, 32);
    const material = this.getStandardMaterial();
    material.side = THREE.DoubleSide;

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0.1, 0);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);

    if (this.contactShadow) {
      this.contactShadow.scale.set(1.1, 0.35, 1.0);
      this.contactShadow.position.y = -1.44;
    }

    this.currentMode = 'background';
  }

  createSphere() {
    this.cleanMesh();
    this.toggleStudioShadows(true);

    const geometry = new THREE.SphereGeometry(1.4, 64, 64);
    const material = this.getStandardMaterial();

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0, 0);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);

    if (this.contactShadow) {
      this.contactShadow.scale.set(1.0, 1.0, 1.0);
      this.contactShadow.position.y = -1.44;
    }

    this.currentMode = 'sphere';
  }

  createCube() {
    this.cleanMesh();
    this.toggleStudioShadows(true);

    const geometry = new THREE.BoxGeometry(2.0, 2.0, 2.0, 16, 16, 16);
    const material = this.getStandardMaterial();

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0, 0);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);

    if (this.contactShadow) {
      this.contactShadow.scale.set(1.15, 1.15, 1.15);
      this.contactShadow.position.y = -1.44;
    }

    this.currentMode = 'cube';
  }

  createCylinder() {
    this.cleanMesh();
    this.toggleStudioShadows(true);

    const geometry = new THREE.CylinderGeometry(1.1, 1.1, 2.3, 64, 16);
    const material = this.getStandardMaterial();

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0, 0);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);

    if (this.contactShadow) {
      this.contactShadow.scale.set(1.05, 1.05, 1.05);
      this.contactShadow.position.y = -1.44;
    }

    this.currentMode = 'cylinder';
  }

  createCloth() {
    this.cleanMesh();
    this.toggleStudioShadows(true);

    const width = 2.4;
    const height = 2.6;
    const segmentsX = 96;
    const segmentsY = 64;

    // 1. Parametric drapery geometry with vertical pleats and cascading ripples
    const geometry = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
    const pos = geometry.attributes.position;
    const waveFreq = (Math.PI * 8.0) / width;

    for (let i = 0; i < pos.count; i++) {
      const origX = pos.getX(i);
      const y = pos.getY(i);

      // Normalized y from top (0.0) to bottom (1.0)
      const normY = (height / 2 - y) / height;

      // Primary vertical accordion folds (deeper at bottom as fabric gathers)
      const pleatAmp = 0.16 + 0.08 * normY;
      const primaryPleat = Math.sin(origX * waveFreq) * pleatAmp;

      // Secondary undulating waves and soft organic ripples
      const secondaryWave = Math.sin(origX * waveFreq * 2.0 + normY * 3.5) * (0.035 * normY);

      // Natural forward drape hang curve
      const drapeSag = Math.sin(normY * Math.PI * 0.9) * 0.07;

      // Subtle bottom hem flutter
      const hemCurl = Math.cos(origX * 16.0) * (0.015 * Math.pow(normY, 3));

      const z = primaryPleat + secondaryWave + drapeSag + hemCurl;
      pos.setZ(i, z);

      // Natural horizontal gathering towards pleat centers
      const gatherFactor = 1.0 - (1.0 - Math.cos(origX * waveFreq)) * 0.035 * (1.0 - normY * 0.4);
      pos.setX(i, origX * gatherFactor);
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: this.texture ? 0xffffff : 0x38bdf8,
      map: this.texture || null,
      bumpMap: this.bumpTexture || null,
      bumpScale: this.materialSettings.bumpScale * 1.8,
      roughness: Math.max(0.65, this.materialSettings.roughness),
      metalness: 0.02,
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide,
      envMapIntensity: 0.5,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0.0, 0);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);

    // 2. Studio Drapery Hardware (Titanium Rod & Hanging Eyelets)
    const hardwareGroup = new THREE.Group();
    hardwareGroup.name = 'drapeHardware';

    const rodMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.25,
    });

    const rodLength = width + 0.5;
    const rodY = height / 2 + 0.06;

    // Hanging Rod
    const rodGeo = new THREE.CylinderGeometry(0.028, 0.028, rodLength, 24);
    const rod = new THREE.Mesh(rodGeo, rodMaterial);
    rod.rotation.z = Math.PI / 2;
    rod.position.set(0, rodY, 0);
    rod.castShadow = true;
    rod.receiveShadow = true;
    hardwareGroup.add(rod);

    // Finials (Rod end caps)
    const finialGeo = new THREE.SphereGeometry(0.055, 16, 16);
    const leftFinial = new THREE.Mesh(finialGeo, rodMaterial);
    leftFinial.position.set(-rodLength / 2, rodY, 0);
    leftFinial.castShadow = true;
    hardwareGroup.add(leftFinial);

    const rightFinial = new THREE.Mesh(finialGeo, rodMaterial);
    rightFinial.position.set(rodLength / 2, rodY, 0);
    rightFinial.castShadow = true;
    hardwareGroup.add(rightFinial);

    // Hanging Rings across the top pleats
    const ringGeo = new THREE.TorusGeometry(0.048, 0.009, 12, 24);
    const numRings = 9;
    const ringSpacing = (width * 0.92) / (numRings - 1);

    for (let r = 0; r < numRings; r++) {
      const rx = -(width * 0.92) / 2 + r * ringSpacing;
      const rz = Math.sin(rx * waveFreq) * 0.16 * 0.5;
      const ring = new THREE.Mesh(ringGeo, rodMaterial);
      ring.position.set(rx, rodY - 0.02, rz);
      ring.castShadow = true;
      hardwareGroup.add(ring);
    }

    // Attach hardware to mesh so it rotates together seamlessly
    this.mesh.add(hardwareGroup);

    // 3. Ground contact shadow disc underneath the drapery foot
    if (this.contactShadow) {
      this.contactShadow.scale.set(1.35, 0.45, 1.0);
      this.contactShadow.position.set(0, -1.44, 0.04);
    }

    this.currentMode = 'cloth';
  }

  createWall() {
    this.cleanMesh();
    this.toggleStudioShadows(false);

    // Architectural 150mm L-shaped wall
    const wallThickness = 0.15; // Exact 150mm thickness as requested
    const wallLengthX = 6.8;   // Long wall total length along X
    const wallLengthZ = 4.2;   // Short wall total length along Z
    const wallHeight = 3.2;    // Architectural wall height
    const skirtingHeight = 0.12;
    const skirtingDepth = 0.025;

    // Corner origin (outer corner)
    const cornerX = -2.6;
    const cornerZ = -2.0;

    // Inside wall dimensions
    const innerLengthX = wallLengthX - wallThickness; // 6.65m
    const innerLengthZ = wallLengthZ - wallThickness; // 4.05m

    // Interior Wall Material (Our user texture - only applied to inside faces)
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: this.texture ? 0xffffff : 0x38bdf8,
      map: this.texture || null,
      bumpMap: this.bumpTexture || null,
      bumpScale: this.materialSettings.bumpScale,
      roughness: this.materialSettings.roughness,
      metalness: this.materialSettings.metalness,
      envMapIntensity: 0.5,
    });
    this.wallMaterial = wallMaterial;

    // Architectural Studio Matte Gray Material for all outer sides, top, ends, and bottom
    const grayWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x828d9c, // Clean architectural matte gray
      roughness: 0.82,
      metalness: 0.04,
      envMapIntensity: 0.35,
    });

    // --- Wall 1 (Back Wall along X) ---
    // Width along X = innerLengthX, Height = wallHeight, Depth along Z = wallThickness
    const wall1Geometry = new THREE.BoxGeometry(innerLengthX, wallHeight, wallThickness);
    // Face mapping for BoxGeometry:
    // 0: +X (Right exposed end cap) -> GRAY
    // 1: -X (Left end touching Wall 2 at corner) -> GRAY
    // 2: +Y (Top surface) -> GRAY
    // 3: -Y (Bottom surface) -> GRAY
    // 4: +Z (Inside wall face facing into room) -> USER TEXTURE!
    // 5: -Z (Back outside face) -> GRAY
    const wall1 = new THREE.Mesh(wall1Geometry, [
      grayWallMaterial, // +X (exposed end)
      grayWallMaterial, // -X (corner joint)
      grayWallMaterial, // +Y (top)
      grayWallMaterial, // -Y (bottom)
      wallMaterial,     // +Z (INSIDE WALL 1: TEXTURE)
      grayWallMaterial, // -Z (outside back)
    ]);
    const wall1PosX = cornerX + wallThickness + innerLengthX / 2;
    const wall1PosY = wallHeight / 2;
    const wall1PosZ = cornerZ + wallThickness / 2;
    wall1.position.set(wall1PosX, wall1PosY, wall1PosZ);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    wall1.name = 'wall1';
    this.scene.add(wall1);
    this.mesh = wall1;

    // --- Wall 2 (Perpendicular Left Wall along Z) ---
    // Width along X = wallThickness, Height = wallHeight, Depth along Z = wallLengthZ
    const wall2Geometry = new THREE.BoxGeometry(wallThickness, wallHeight, wallLengthZ);

    // Scale UVs on inside textured face (+X, face 0) so texture tile scale matches Wall 1 proportionally
    const uScale2 = innerLengthZ / innerLengthX;
    const uvAttr = wall2Geometry.attributes.uv;
    // Vertices 0, 1, 2, 3 correspond to face 0 (+X)
    uvAttr.setX(0, 0);
    uvAttr.setX(1, uScale2);
    uvAttr.setX(2, 0);
    uvAttr.setX(3, uScale2);
    uvAttr.needsUpdate = true;

    // Face mapping for BoxGeometry:
    // 0: +X (Inside wall face facing room) -> USER TEXTURE!
    // 1: -X (Outside left face) -> GRAY
    // 2: +Y (Top surface) -> GRAY
    // 3: -Y (Bottom surface) -> GRAY
    // 4: +Z (Front exposed end cap) -> GRAY
    // 5: -Z (Back corner face at cornerZ) -> GRAY
    const wall2 = new THREE.Mesh(wall2Geometry, [
      wallMaterial,     // +X (INSIDE WALL 2: TEXTURE)
      grayWallMaterial, // -X (outside left)
      grayWallMaterial, // +Y (top)
      grayWallMaterial, // -Y (bottom)
      grayWallMaterial, // +Z (exposed end)
      grayWallMaterial, // -Z (corner back)
    ]);
    const wall2PosX = cornerX + wallThickness / 2;
    const wall2PosY = wallHeight / 2;
    const wall2PosZ = cornerZ + wallLengthZ / 2;
    wall2.position.set(wall2PosX, wall2PosY, wall2PosZ);
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    wall2.name = 'wall2';
    this.scene.add(wall2);

    this.addSkirting(cornerX, cornerZ, wallLengthX, wallLengthZ, wallThickness, skirtingHeight, skirtingDepth);
    this.addStudioFloor(cornerX, cornerZ, wallLengthX, wallLengthZ);
    this.addChair(cornerX, cornerZ, wallThickness);

    this.currentMode = 'wall';
  }

  addSkirting(cornerX, cornerZ, wallLengthX, wallLengthZ, wallThickness, skirtingHeight, skirtingDepth) {
    const skirtingY = skirtingHeight / 2;
    const skirtingMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.6,
      envMapIntensity: 0.6,
    });

    const innerLengthX = wallLengthX - wallThickness;
    const innerLengthZ = wallLengthZ - wallThickness;

    // Skirting 1 along Wall 1 (X axis)
    const skirting1Geo = new THREE.BoxGeometry(innerLengthX, skirtingHeight, skirtingDepth);
    const skirting1 = new THREE.Mesh(skirting1Geo, skirtingMaterial);
    skirting1.position.set(
      cornerX + wallThickness + innerLengthX / 2,
      skirtingY,
      cornerZ + wallThickness + skirtingDepth / 2
    );
    skirting1.castShadow = true;
    skirting1.receiveShadow = true;
    skirting1.name = 'skirting1';
    this.scene.add(skirting1);

    // Skirting 2 along Wall 2 (Z axis) - perfectly flush joint at corner
    const skirting2Length = innerLengthZ - skirtingDepth;
    const skirting2Geo = new THREE.BoxGeometry(skirtingDepth, skirtingHeight, skirting2Length);
    const skirting2 = new THREE.Mesh(skirting2Geo, skirtingMaterial);
    skirting2.position.set(
      cornerX + wallThickness + skirtingDepth / 2,
      skirtingY,
      cornerZ + wallThickness + skirtingDepth + skirting2Length / 2
    );
    skirting2.castShadow = true;
    skirting2.receiveShadow = true;
    skirting2.name = 'skirting2';
    this.scene.add(skirting2);
  }

  addStudioFloor(cornerX = -2.6, cornerZ = -2.0, wallLengthX = 6.8, wallLengthZ = 4.2) {
    this.removeObjectByName('wallStudioFloor');

    const floorGeometry = new THREE.PlaneGeometry(16, 16);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x182232,
      roughness: 0.38,
      metalness: 0.2,
      envMapIntensity: 0.5,
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(cornerX + wallLengthX / 2 - 0.5, 0, cornerZ + wallLengthZ / 2);
    floor.receiveShadow = true;
    floor.name = 'wallStudioFloor';
    this.scene.add(floor);
  }

  addChair(cornerX = -2.6, cornerZ = -2.0, wallThickness = 0.15) {
    this.removeObjectByName('referenceChair');

    const chairGroup = new THREE.Group();
    chairGroup.name = 'referenceChair';

    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.8,
    });

    const cushionMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.6,
      metalness: 0.1,
    });

    // Seat
    const seatGeo = new THREE.BoxGeometry(0.65, 0.08, 0.65);
    const seat = new THREE.Mesh(seatGeo, cushionMaterial);
    seat.position.y = 0.46;
    seat.castShadow = true;
    seat.receiveShadow = true;
    chairGroup.add(seat);

    // Backrest
    const backGeo = new THREE.BoxGeometry(0.65, 0.65, 0.06);
    const back = new THREE.Mesh(backGeo, cushionMaterial);
    back.position.set(0, 0.46 + 0.35, -0.295);
    back.castShadow = true;
    back.receiveShadow = true;
    chairGroup.add(back);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.46, 12);
    const legPositions = [
      { x: 0.28, z: 0.28 },
      { x: -0.28, z: 0.28 },
      { x: 0.28, z: -0.28 },
      { x: -0.28, z: -0.28 },
    ];

    legPositions.forEach((pos) => {
      const leg = new THREE.Mesh(legGeo, frameMaterial);
      leg.position.set(pos.x, 0.46 / 2, pos.z);
      leg.castShadow = true;
      leg.receiveShadow = true;
      chairGroup.add(leg);
    });

    chairGroup.position.set(cornerX + wallThickness + 1.4, 0, cornerZ + wallThickness + 1.4);
    chairGroup.rotation.y = Math.PI / 4;
    this.scene.add(chairGroup);
  }

  toggleStudioShadows(visible) {
    if (this.shadowPlane) this.shadowPlane.visible = visible;
    if (this.contactShadow) this.contactShadow.visible = visible;
  }

  cleanMesh() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      if (this.mesh.geometry) this.mesh.geometry.dispose();
      if (this.mesh.material) {
        if (Array.isArray(this.mesh.material)) {
          this.mesh.material.forEach((m) => m && m.dispose());
        } else {
          this.mesh.material.dispose();
        }
      }
      this.mesh = null;
    }

    ['wall1', 'wall2', 'skirting1', 'skirting2', 'wallStudioFloor', 'referenceChair'].forEach((name) => {
      this.removeObjectByName(name);
    });
  }

  removeObjectByName(name) {
    const obj = this.scene.getObjectByName(name);
    if (obj) {
      this.scene.remove(obj);
      obj.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m && m.dispose());
          } else if (child.material.dispose) {
            child.material.dispose();
          }
        }
      });
    }
  }

  // --- Texture Updates ---

  updateTexture(dataURL, tileSteps = {}) {
    if (tileSteps && (tileSteps.widthSteps || tileSteps.heightSteps)) {
      this.tileSteps = {
        widthSteps: tileSteps.widthSteps ?? this.tileSteps.widthSteps,
        heightSteps: tileSteps.heightSteps ?? this.tileSteps.heightSteps,
      };
    }

    const loader = new THREE.TextureLoader();
    loader.load(
      dataURL,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        const { widthSteps, heightSteps } = this.tileSteps;
        const baseRepeat = this.currentMode === 'wall' ? 2.2 : 1;
        const repeatX = baseRepeat * (widthSteps / 16);
        const repeatY = baseRepeat * (heightSteps / 16);
        texture.repeat.set(repeatX, repeatY);

        if (texture.colorSpace !== undefined) {
          texture.colorSpace = THREE.SRGBColorSpace;
        }

        if (this.texture) {
          this.texture.dispose();
        }
        this.texture = texture;

        if (texture.image) {
          this.rawImage = texture.image;
          if (this.bumpTexture) this.bumpTexture.dispose();
          this.bumpTexture = this.generateBumpMapFromImage(texture.image);
          if (this.bumpTexture) {
            this.bumpTexture.repeat.set(repeatX, repeatY);
          }
        }

        this.refreshCurrentModeGeometry();
      },
      undefined,
      (err) => {
        console.error('Error loading texture into Three.js:', err);
      }
    );
  }

  refreshCurrentModeGeometry() {
    switch (this.currentMode) {
    case 'background':
      this.createPlane();
      break;
    case 'sphere':
      this.createSphere();
      break;
    case 'cube':
      this.createCube();
      break;
    case 'cylinder':
      this.createCylinder();
      break;
    case 'cloth':
      this.createCloth();
      break;
    case 'wall':
      this.createWall();
      break;
    default:
      this.createSphere();
      break;
    }
  }

  setMaterialProperty(property, value) {
    if (this.materialSettings[property] !== undefined) {
      this.materialSettings[property] = value;
    }

    if (this.wallMaterial) {
      if (property === 'roughness') this.wallMaterial.roughness = value;
      if (property === 'metalness') this.wallMaterial.metalness = value;
      if (property === 'bumpScale') this.wallMaterial.bumpScale = value;
      this.wallMaterial.needsUpdate = true;
    }

    if (this.mesh && this.mesh.material) {
      const mats = Array.isArray(this.mesh.material) ? this.mesh.material : [this.mesh.material];
      mats.forEach((mat) => {
        if (!mat) return;
        if (property === 'roughness') mat.roughness = value;
        if (property === 'metalness') mat.metalness = value;
        if (property === 'bumpScale') mat.bumpScale = value;
        mat.needsUpdate = true;
      });
    }
  }

  setMode(mode) {
    if (mode === 'background') {
      this.createPlane();
      this.resetCameraForModel('background');
    } else if (mode === 'cloth') {
      this.createCloth();
      this.resetCameraForModel('cloth');
    } else if (mode === 'wall') {
      this.createWall();
      this.resetCameraForModel('wall');
    } else if (mode === 'cube') {
      this.createCube();
      this.resetCameraForModel('cube');
    } else if (mode === 'cylinder') {
      this.createCylinder();
      this.resetCameraForModel('cylinder');
    } else {
      this.createSphere();
      this.resetCameraForModel('sphere');
    }
  }

  resetCameraForModel(mode) {
    if (!this.camera || !this.controls) return;

    if (mode === 'background') {
      this.camera.position.set(0, 0.1, 4.4);
      this.controls.target.set(0, 0.1, 0);
    } else if (mode === 'wall') {
      this.camera.position.set(4.2, 4.6, 6.8);
      this.controls.target.set(0.6, 1.2, -0.2);
    } else if (mode === 'cloth') {
      this.camera.position.set(1.5, 0.2, 4.8);
      this.controls.target.set(0, 0, 0);
    } else {
      this.camera.position.set(3.4, 2.2, 4.8);
      this.controls.target.set(0, 0, 0);
    }
    this.camera.lookAt(this.controls.target);
    this.controls.update();
  }

  resetCamera() {
    this.resetCameraForModel(this.currentMode);
  }

  toggleAutoRotate(enabled) {
    this.autoRotate = enabled !== undefined ? enabled : !this.autoRotate;
    const autoRotateCheckbox = document.getElementById('autoRotateToggle');
    if (autoRotateCheckbox && autoRotateCheckbox.checked !== this.autoRotate) {
      autoRotateCheckbox.checked = this.autoRotate;
    }
    return this.autoRotate;
  }

  captureScreenshot() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    if (this.controls) {
      this.controls.update();
    }

    // Subtle turntable rotation when autoRotate is on and not in wall or background mode
    if (this.autoRotate && this.mesh && this.currentMode !== 'wall' && this.currentMode !== 'background') {
      this.mesh.rotation.y += this.autoRotateSpeed;
    }

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;

    const width = this.container.clientWidth || (window.innerWidth - 350);
    const height = this.container.clientHeight || window.innerHeight;

    if (width > 0 && height > 0) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
    }

    if (this._pointerMoveHandler && this.renderer && this.renderer.domElement) {
      this.renderer.domElement.removeEventListener('pointermove', this._pointerMoveHandler);
    }

    if (this.controls) {
      if (this._disableAutoRotateOnDrag) {
        this.controls.removeEventListener('start', this._disableAutoRotateOnDrag);
      }
      this.controls.dispose();
    }

    this.cleanMesh();

    if (this.shadowPlane) {
      this.shadowPlane.geometry.dispose();
      this.shadowPlane.material.dispose();
    }

    if (this.contactShadow) {
      this.contactShadow.geometry.dispose();
      this.contactShadow.material.dispose();
    }

    if (this.texture) {
      this.texture.dispose();
    }

    if (this.bumpTexture) {
      this.bumpTexture.dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.container && this.renderer.domElement) {
        this.container.removeChild(this.renderer.domElement);
      }
    }
  }
}
