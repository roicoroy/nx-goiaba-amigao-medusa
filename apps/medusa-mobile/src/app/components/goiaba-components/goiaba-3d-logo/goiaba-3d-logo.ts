import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, NgZone, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

@Component({
  selector: 'app-goiaba-3d-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full h-full flex items-center justify-center bg-base-200 rounded-lg">
      <canvas #threeCanvas class="w-full h-full"></canvas>

      <!-- Loading Overlay -->
      @if (isLoading && !hideLoadingIndicator) {
      <div class="absolute inset-0 flex items-center justify-center bg-base-300/80 backdrop-blur-sm rounded-lg">
        <div class="flex flex-col items-center gap-3">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-xs text-base-content/70">Loading 3D Logo...</p>
        </div>
      </div>
      }

      <!-- Error Overlay -->
      @if (errorMessage) {
      <div class="absolute inset-0 flex items-center justify-center bg-error/10 backdrop-blur-sm rounded-lg">
        <div class="flex flex-col items-center gap-3 max-w-xs px-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div class="text-center">
            <p class="text-xs font-semibold text-error mb-1">Failed to Load Logo</p>
            <p class="text-xs text-base-content/70">{{ errorMessage }}</p>
          </div>
        </div>
      </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 200px;
    }
  `]
})
export class Goiaba3DLogoComponent implements AfterViewInit, OnDestroy {
  @ViewChild('threeCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() modelPath = '/assets/3D/logo-v5.gltf';
  @Input() autoRotate = false;
  @Input() autoRotateSpeed = 2.0;
  @Input() enableZoom = false;
  @Input() enablePan = false;
  @Input() greenTint = false;
  @Input() greenColor = '#4ade80'; // Nice green shade (you can customize this)
  @Input() tintStrength = 0.6; // 0-1, how much green to apply
  @Input() backgroundColor = '#000000'; // Background color (hex string)
  @Input() transparentBackground = false; // For header usage
  @Input() hideLoadingIndicator = false; // Hide loading spinner for header

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private model?: THREE.Group;
  private animationId?: number;
  private resizeObserver?: ResizeObserver;

  isLoading = true;
  errorMessage = '';

  constructor(private ngZone: NgZone) { }

  ngAfterViewInit(): void {
    // Run Three.js initialization outside Angular zone to avoid triggering change detection
    this.ngZone.runOutsideAngular(() => {
      this.initThreeScene();
    });
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private cleanup(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.controls) {
      this.controls.dispose();
    }
    if (this.model) {
      this.scene.remove(this.model);
      this.disposeObject(this.model);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    window.removeEventListener('resize', this.onWindowResize);
  }

  private disposeObject(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }

  private async initThreeScene(): Promise<void> {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement!;

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const bgColor = new THREE.Color(this.backgroundColor);
    this.renderer.setClearColor(bgColor, this.transparentBackground ? 0 : 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Initialize scene
    this.scene = new THREE.Scene();

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 3);
    this.camera.lookAt(0, 0, 0);

    // Update renderer size
    this.updateRendererSize();

    // Initialize controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = this.autoRotateSpeed;
    this.controls.enableZoom = this.enableZoom;
    this.controls.enablePan = this.enablePan;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 10;

    // Setup lighting
    this.setupLighting();

    // Load 3D model
    await this.loadModel();

    // Setup ResizeObserver to handle dynamic resizing
    this.setupResizeObserver();

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize);

    // Force initial resize after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.updateRendererSize();
    }, 100);

    // Start animation loop
    this.animate();
  }

  private setupResizeObserver(): void {
    const container = this.canvasRef.nativeElement.parentElement!;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          // Modern browsers
          const contentBoxSize = Array.isArray(entry.contentBoxSize)
            ? entry.contentBoxSize[0]
            : entry.contentBoxSize;

          const width = contentBoxSize.inlineSize;
          const height = contentBoxSize.blockSize;

          if (width > 0 && height > 0) {
            console.log('👁️ ResizeObserver detected size change:', { width, height });
            this.updateRendererSize();
          }
        }
      }
    });

    this.resizeObserver.observe(container);
  }

  private setupLighting(): void {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Main directional light (key light)
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(5, 5, 5);
    mainLight.castShadow = false;
    this.scene.add(mainLight);

    // Fill light (softer, from opposite side)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-3, 0, -3);
    this.scene.add(fillLight);

    // Back light (rim light for depth)
    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(0, 3, -5);
    this.scene.add(backLight);

    // Hemisphere light for natural lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
    this.scene.add(hemiLight);
  }

  private async loadModel(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      console.log('🎨 Loading 3D model from:', this.modelPath);

      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(this.modelPath);

      console.log('✅ 3D model loaded successfully:', gltf);

      this.model = gltf.scene;

      // Center and scale the model
      const box = new THREE.Box3().setFromObject(this.model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      console.log('📦 Model bounding box:', {
        center: center.toArray(),
        size: size.toArray(),
        min: box.min.toArray(),
        max: box.max.toArray()
      });

      // Calculate scale to fit the model in view
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2.0 / maxDim; // Adjust this value to control logo size

      console.log('📏 Scaling:', { maxDim, scale, finalScale: scale });

      this.model.scale.multiplyScalar(scale);
      this.model.position.sub(center.multiplyScalar(scale));

      // Rotate model to face forward (toward camera)
      this.model.rotation.y = 0; // Face straight ahead
      this.model.rotation.x = 0;
      this.model.rotation.z = 0;

      console.log('📍 Model position after centering:', this.model.position.toArray());
      console.log('🎥 Camera position:', this.camera.position.toArray());

      // Apply green tint to materials
      if (this.greenTint) {
        this.applyGreenTint();
      }

      // Ensure materials are properly configured
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = false;
          child.receiveShadow = false;

          // Enhance material properties for better appearance
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.needsUpdate = true;
                }
              });
            } else if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.needsUpdate = true;
            }
          }
        }
      });

      this.scene.add(this.model);

      console.log('✨ Model added to scene. Children count:', this.scene.children.length);
      console.log('🔦 Lights in scene:', this.scene.children.filter(c => c instanceof THREE.Light).length);

      // Update controls target to model center
      this.controls.target.set(0, 0, 0);
      this.controls.update();

      this.isLoading = false;
      this.errorMessage = '';

      console.log('🎬 Rendering started. Canvas size:', this.renderer.domElement.width, 'x', this.renderer.domElement.height);

    } catch (error) {
      console.error('❌ Error loading 3D logo model:', error);
      console.error('Model path attempted:', this.modelPath);
      this.isLoading = false;

      // Set user-friendly error message
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        if (error.message.includes('404') || error.message.includes('Not Found')) {
          this.errorMessage = `Model file not found: ${this.modelPath}`;
        } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          this.errorMessage = 'Network error. Please check your connection.';
        } else {
          this.errorMessage = `Unable to load 3D model: ${error.message}`;
        }
      } else {
        this.errorMessage = 'An unexpected error occurred.';
      }
    }
  }

  private applyGreenTint(): void {
    if (!this.model) return;

    const greenColor = new THREE.Color(this.greenColor);
    console.log('🎨 Applying green tint:', this.greenColor, 'strength:', this.tintStrength);

    this.model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];

        materials.forEach((material) => {
          if (material instanceof THREE.MeshStandardMaterial ||
              material instanceof THREE.MeshPhongMaterial ||
              material instanceof THREE.MeshBasicMaterial) {

            // Store original color if not already stored
            if (!(material as any).originalColor) {
              (material as any).originalColor = material.color.clone();
            }

            // Blend original color with green
            const originalColor = (material as any).originalColor;
            material.color = new THREE.Color().lerpColors(
              originalColor,
              greenColor,
              this.tintStrength
            );

            // Optionally add some emissive green glow
            if (material instanceof THREE.MeshStandardMaterial) {
              material.emissive = new THREE.Color(this.greenColor);
              material.emissiveIntensity = 0.1;
            }

            material.needsUpdate = true;
          }
        });
      }
    });
  }

  private updateRendererSize(): void {
    const container = this.canvasRef.nativeElement.parentElement!;
    let width = container.clientWidth;
    let height = container.clientHeight;

    // Fallback to minimum size if container has no dimensions
    if (width === 0 || height === 0) {
      console.warn('⚠️ Container has no dimensions, using fallback size');
      width = 256;
      height = 256;
    }

    console.log('📐 Updating renderer size:', { width, height });

    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private onWindowResize = (): void => {
    this.updateRendererSize();
  };

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    // Update controls
    this.controls.update();

    // Render scene
    this.renderer.render(this.scene, this.camera);
  };

  // Public methods for external control
  public toggleAutoRotate(): void {
    this.controls.autoRotate = !this.controls.autoRotate;
  }

  public resetCamera(): void {
    this.camera.position.set(0, 0, 3);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  public setAutoRotateSpeed(speed: number): void {
    this.autoRotateSpeed = speed;
    this.controls.autoRotateSpeed = speed;
  }
}
