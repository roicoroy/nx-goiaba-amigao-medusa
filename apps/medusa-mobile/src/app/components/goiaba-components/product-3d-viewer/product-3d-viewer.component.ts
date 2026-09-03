import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, NgZone, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

@Component({
  selector: 'app-product-3d-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card bg-base-200 shadow-xl">
      <div class="card-body p-0">
        <!-- 3D Viewer Container -->
        <div #viewerContainer class="relative w-full bg-gradient-to-br from-base-300 to-base-200 rounded-t-2xl overflow-hidden viewer-container">
          <canvas #threeCanvas class="w-full h-full"></canvas>

          <!-- Loading Overlay -->
          @if (isLoading) {
          <div class="absolute inset-0 flex items-center justify-center bg-base-300/80 backdrop-blur-sm">
            <div class="flex flex-col items-center gap-4">
              <span class="loading loading-spinner loading-lg text-primary"></span>
              <p class="text-sm text-base-content/70">Loading 3D Model...</p>
            </div>
          </div>
          }

          <!-- Error Overlay -->
          @if (errorMessage) {
          <div class="absolute inset-0 flex items-center justify-center bg-error/10 backdrop-blur-sm">
            <div class="flex flex-col items-center gap-4 max-w-md px-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div class="text-center">
                <p class="text-sm font-semibold text-error mb-1">3D View Unavailable</p>
                <p class="text-xs text-base-content/70">{{ errorMessage }}</p>
              </div>
            </div>
          </div>
          }

          <!-- Controls Info Badge -->
          <div class="absolute top-4 left-4 badge badge-sm badge-ghost backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            Drag to rotate
          </div>

          <!-- Reset View Button -->
          <button
            class="btn btn-circle btn-sm absolute top-4 right-4 backdrop-blur-sm"
            (click)="resetCamera()"
            title="Reset View">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <!-- Control Panel -->
        <div class="px-4 py-3 bg-base-100">
          <div class="flex items-center justify-between">
            <label class="label cursor-pointer gap-2">
              <input
                type="checkbox"
                class="toggle toggle-primary toggle-sm"
                [checked]="autoRotate"
                (change)="toggleAutoRotate()" />
              <span class="label-text text-xs">Auto Rotate</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .viewer-container {
      height: 400px;
      min-height: 300px;
    }
    @media (min-width: 768px) {
      .viewer-container {
        height: 500px;
      }
    }
  `]
})
export class Product3DViewerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('threeCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('viewerContainer', { static: false }) containerRef!: ElementRef<HTMLDivElement>;

  @Input() modelUrl: string = '/assets/3D/logo-v5.gltf';
  @Input() autoRotate: boolean = false;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private animationId?: number;
  private model?: THREE.Group;

  isLoading = true;
  errorMessage = '';
  private initialCameraPosition = new THREE.Vector3(2, 1, 2);

  constructor(private ngZone: NgZone) { }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.initScene();
    });
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.controls) {
      this.controls.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    window.removeEventListener('resize', this.onWindowResize);
  }

  private async initScene(): Promise<void> {
    const canvas = this.canvasRef.nativeElement;
    const container = this.containerRef.nativeElement;

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0xf5f5f5, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Initialize scene
    this.scene = new THREE.Scene();

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    this.camera.position.copy(this.initialCameraPosition);

    this.updateRendererSize();

    // Initialize controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = this.autoRotate;
    this.controls.autoRotateSpeed = 2.0;
    this.controls.enableZoom = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 0.5;
    this.controls.maxDistance = 10;

    // Add lights
    this.setupLighting();

    // Add grid helper
    const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444);
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);

    // Load 3D model
    await this.loadModel();

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize);

    // Start animation loop
    this.animate();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(5, 5, 5);
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-5, 0, -5);
    this.scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    this.scene.add(hemiLight);
  }

  private async loadModel(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      const loader = new GLTFLoader();
      const fileExtension = this.modelUrl.split('.').pop()?.toLowerCase();

      let gltf;

      if (fileExtension === 'glb') {
        // For binary GLB files, fetch as ArrayBuffer
        const response = await fetch(this.modelUrl);
        if (!response.ok) throw new Error(`Failed to load: ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();
        gltf = await new Promise<any>((resolve, reject) => {
          loader.parse(
            arrayBuffer,
            '',
            (result) => resolve(result),
            (error) => reject(error)
          );
        });
      } else {
        // For text GLTF files, use normal loading
        gltf = await loader.loadAsync(this.modelUrl);
      }

      this.model = gltf.scene;

      if (!this.model) {
        throw new Error('Model scene not found');
      }

      // Center and scale the model
      const box = new THREE.Box3().setFromObject(this.model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 1.5 / maxDim;

      this.model.scale.multiplyScalar(scale);
      this.model.position.sub(center.multiplyScalar(scale));

      this.scene.add(this.model);

      this.controls.target.set(0, 0, 0);
      this.controls.update();

      this.isLoading = false;
    } catch (error) {
      console.error('Error loading 3D model:', error);
      this.isLoading = false;
      this.errorMessage = 'Could not load 3D model. Using standard product images.';
    }
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize = (): void => {
    this.updateRendererSize();
  }

  private updateRendererSize(): void {
    const container = this.containerRef.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  toggleAutoRotate(): void {
    this.autoRotate = !this.autoRotate;
    this.controls.autoRotate = this.autoRotate;
  }

  resetCamera(): void {
    this.camera.position.copy(this.initialCameraPosition);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }
}
