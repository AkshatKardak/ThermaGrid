/**
 * Procedural Earth Canvas Texture Generator & Asynchronous Photorealistic Texture Loader.
 * Guarantees zero missing assets, fast offline rendering, and tactical instrument-grade Earth visuals.
 */

import * as THREE from 'three';

export function createProceduralEarthTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Helper to project Lat/Lng to equirectangular canvas coordinates
  const toX = (lng: number) => ((lng + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  // 1. Deep Ocean Base Gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0.0, '#040911');
  oceanGrad.addColorStop(0.2, '#071322');
  oceanGrad.addColorStop(0.5, '#0A1A2E');
  oceanGrad.addColorStop(0.8, '#071322');
  oceanGrad.addColorStop(1.0, '#040911');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Subtle Ocean Bathymetry & Currents
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
  ctx.lineWidth = 1.5;
  for (let lat = -75; lat <= 75; lat += 15) {
    ctx.beginPath();
    ctx.moveTo(0, toY(lat));
    ctx.lineTo(width, toY(lat));
    ctx.stroke();
  }
  for (let lng = -180; lng <= 180; lng += 30) {
    ctx.beginPath();
    ctx.moveTo(toX(lng), 0);
    ctx.lineTo(toX(lng), height);
    ctx.stroke();
  }

  // 3. Helper to draw polygons with tactical styling
  const drawLandmass = (
    coords: [number, number][],
    fillColor = '#1A2938',
    borderColor = '#38BDF8',
    glow = true
  ) => {
    ctx.beginPath();
    coords.forEach(([lng, lat], idx) => {
      const x = toX(lng);
      const y = toY(lat);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    ctx.fillStyle = fillColor;
    ctx.fill();

    if (glow) {
      ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
      ctx.shadowBlur = 6;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }
  };

  // 4. Continents Geometries (Approximate Equirectangular Polygons)

  // India & South Asia (High detail for primary focus)
  const india = [
    [68, 24], [70, 21], [72, 19], [73, 15], [76, 10], [77.5, 8], [80, 10], [80, 13],
    [82, 16], [85, 19], [87, 21.5], [89, 22], [92, 21], [92, 24], [97, 28], [94, 29],
    [88, 27.5], [84, 28.5], [80, 31], [77, 32.5], [74, 34], [74, 36.5], [71, 33],
    [69, 28], [68, 24],
  ];
  drawLandmass(india as [number, number][], '#22384C', '#38BDF8', true);

  // Sri Lanka
  const sriLanka = [[80, 9.5], [81.5, 8], [81.5, 6.5], [80, 6.5], [79.5, 8], [80, 9.5]];
  drawLandmass(sriLanka as [number, number][], '#22384C', '#38BDF8', false);

  // Africa
  const africa = [
    [-17, 15], [-12, 5], [0, 5], [9, 4], [9, -4], [12, -15], [18, -34], [28, -34],
    [32, -26], [40, -10], [51, 12], [43, 12], [35, 27], [32, 31], [25, 32], [10, 37],
    [-2, 35], [-6, 36], [-10, 30], [-17, 21], [-17, 15],
  ];
  drawLandmass(africa as [number, number][], '#1B2C3C', '#22D3EE', true);

  // Madagascar
  const madagascar = [[43, -12], [50, -13], [48, -25], [44, -25], [43, -12]];
  drawLandmass(madagascar as [number, number][], '#1B2C3C', '#22D3EE', false);

  // Eurasia (Europe + Northern Asia + China + SE Asia)
  const eurasia = [
    [-9, 36], [-9, 43], [0, 46], [2, 51], [5, 58], [15, 55], [20, 60], [25, 71],
    [40, 68], [60, 70], [80, 73], [100, 76], [120, 74], [140, 72], [170, 66], [170, 60],
    [142, 53], [131, 43], [122, 38], [121, 31], [118, 24], [109, 20], [104, 10], [100, 5],
    [98, 10], [92, 21], [87, 21.5], [80, 13], [77, 8], [73, 15], [68, 24], [62, 25],
    [56, 26], [50, 27], [50, 13], [43, 12], [35, 27], [35, 36], [27, 41], [16, 40],
    [14, 37], [5, 36], [-5, 36], [-9, 36],
  ];
  drawLandmass(eurasia as [number, number][], '#1B2C3C', '#22D3EE', true);

  // British Isles
  const uk = [[-5, 50], [1, 51], [0, 58], [-5, 58], [-5, 50]];
  drawLandmass(uk as [number, number][], '#1B2C3C', '#22D3EE', false);

  // Japan
  const japan = [[130, 32], [132, 34], [140, 36], [141, 41], [144, 44], [141, 45], [138, 37], [130, 32]];
  drawLandmass(japan as [number, number][], '#1B2C3C', '#22D3EE', false);

  // Southeast Asia Archipelago (Indonesia / Philippines)
  const seAsia1 = [[96, 5], [105, -5], [115, -8], [120, -8], [115, -4], [105, 0], [96, 5]];
  drawLandmass(seAsia1 as [number, number][], '#1B2C3C', '#22D3EE', false);
  const seAsia2 = [[110, 1], [118, 5], [118, -3], [110, 1]];
  drawLandmass(seAsia2 as [number, number][], '#1B2C3C', '#22D3EE', false);
  const seAsia3 = [[120, 18], [125, 14], [125, 7], [120, 7], [120, 18]];
  drawLandmass(seAsia3 as [number, number][], '#1B2C3C', '#22D3EE', false);

  // Australia & New Zealand
  const australia = [
    [114, -22], [114, -34], [128, -32], [138, -35], [148, -38], [153, -28], [145, -16],
    [142, -11], [136, -12], [130, -13], [122, -18], [114, -22],
  ];
  drawLandmass(australia as [number, number][], '#1B2C3C', '#22D3EE', true);
  const newZealand = [[166, -46], [174, -41], [178, -38], [174, -35], [172, -43], [166, -46]];
  drawLandmass(newZealand as [number, number][], '#1B2C3C', '#22D3EE', false);

  // North America
  const northAmerica = [
    [-168, 65], [-160, 71], [-130, 70], [-100, 72], [-80, 62], [-65, 58], [-55, 50],
    [-65, 44], [-75, 35], [-80, 25], [-88, 30], [-97, 26], [-97, 20], [-87, 16],
    [-77, 8], [-83, 8], [-100, 18], [-105, 23], [-117, 32], [-124, 40], [-125, 49],
    [-135, 57], [-150, 60], [-168, 65],
  ];
  drawLandmass(northAmerica as [number, number][], '#1B2C3C', '#22D3EE', true);

  // Greenland
  const greenland = [[-50, 60], [-20, 70], [-20, 82], [-50, 83], [-55, 75], [-50, 60]];
  drawLandmass(greenland as [number, number][], '#253B4E', '#38BDF8', false);

  // South America
  const southAmerica = [
    [-77, 8], [-60, 10], [-50, 0], [-35, -5], [-37, -12], [-42, -23], [-50, -32],
    [-58, -38], [-68, -54], [-75, -50], [-72, -35], [-76, -15], [-81, -4], [-77, 8],
  ];
  drawLandmass(southAmerica as [number, number][], '#1B2C3C', '#22D3EE', true);

  // Antarctica Polar Ice Base
  ctx.fillStyle = '#162838';
  ctx.fillRect(0, toY(-65), width, height - toY(-65));
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, toY(-65), width, 1);

  // 5. City Night Light Nodes (Clustered glowing dots across major metropolitan centers)
  const lights = [
    // India Metros
    [72.87, 19.07], [77.10, 28.70], [88.36, 22.57], [80.27, 13.08], [77.59, 12.97],
    [78.48, 17.38], [72.57, 23.02], [79.08, 21.14], [75.85, 26.91], [73.85, 18.52],
    // World Metros
    [55.27, 25.20], [51.40, 35.70], [37.61, 55.75], [2.35, 48.85], [-0.12, 51.50],
    [-74.00, 40.71], [-118.24, 34.05], [139.69, 35.68], [121.47, 31.23], [100.50, 13.75],
    [103.81, 1.35], [151.20, -33.86], [-46.63, -23.55], [31.23, 30.04], [18.42, -33.92]
  ];

  lights.forEach(([lng, lat]) => {
    const lx = toX(lng);
    const ly = toY(lat);
    const radGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, 8);
    radGrad.addColorStop(0, 'rgba(255, 210, 100, 0.95)');
    radGrad.addColorStop(0.3, 'rgba(255, 150, 50, 0.5)');
    radGrad.addColorStop(1, 'rgba(255, 100, 50, 0)');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(lx, ly, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Loads photorealistic NASA/Satellite Earth texture asynchronously with procedural fallback.
 */
export function loadEarthTexture(onLoad: (tex: THREE.Texture) => void): THREE.Texture {
  // 1. Immediately return procedural tactical Earth texture (works 100% offline)
  const initialTex = createProceduralEarthTexture();

  // 2. Asynchronously attempt to load ultra-detailed NASA satellite night texture
  if (typeof window !== 'undefined' && navigator.onLine) {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      'https://unpkg.com/three-globe/example/img/earth-night.jpg',
      (loadedTex) => {
        loadedTex.wrapS = THREE.RepeatWrapping;
        loadedTex.wrapT = THREE.ClampToEdgeWrapping;
        onLoad(loadedTex);
      },
      undefined,
      () => {
        // Fallback to procedural texture on network error
      }
    );
  }

  return initialTex;
}
