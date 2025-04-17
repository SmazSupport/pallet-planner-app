import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Text } from "@react-three/drei";
import "./ThreeDPalletView.css";

const BOX_WIDTH = 20;
const BOX_DEPTH = 14;
const BOX_HEIGHT = 14;

const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 55%)`;
};

const Box = ({ position, sku }) => {
  const color = stringToColor(sku);
  const textProps = {
    fontSize: 3,
    color: "white",
    anchorX: "center",
    anchorY: "middle",
  };

  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[BOX_WIDTH, BOX_HEIGHT, BOX_DEPTH]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Front */}
      <Text position={[0, 0, BOX_DEPTH / 2 + 0.5]} {...textProps}>
        {sku}
      </Text>
      {/* Back */}
      <Text
        position={[0, 0, -BOX_DEPTH / 2 - 0.5]}
        rotation={[0, Math.PI, 0]}
        {...textProps}
      >
        {sku}
      </Text>
      {/* Left */}
      <Text
        position={[-BOX_WIDTH / 2 - 0.5, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        {...textProps}
      >
        {sku}
      </Text>
      {/* Right */}
      <Text
        position={[BOX_WIDTH / 2 + 0.5, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        {...textProps}
      >
        {sku}
      </Text>
    </group>
  );
};

const PalletStack = ({ pallet }) => {
  const boxes = [];
  pallet.layerBreakdown.forEach((layer, layerIndex) => {
    const layerBoxes = Object.entries(layer).flatMap(([sku, count]) =>
      Array.from({ length: count }).map(() => ({ sku }))
    );
    layerBoxes.forEach((box, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = (col - 1) * (BOX_WIDTH + 2);
      const y = BOX_HEIGHT / 2 + layerIndex * (BOX_HEIGHT + 2);
      const z = (row - 0.5) * (BOX_DEPTH + 2);
      boxes.push(
        <Box
          key={`layer${layerIndex}-box${i}`}
          position={[x, y, z]}
          sku={box.sku.split("-")[1] || box.sku}
        />
      );
    });
  });
  return <>{boxes}</>;
};

const ThreeDPalletView = ({ pallets }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Reset activeIndex to 0 if pallets list shrinks or is emptied
  useEffect(() => {
    if (!pallets || pallets.length === 0) {
      setActiveIndex(0);
    } else if (activeIndex >= pallets.length) {
      setActiveIndex(0);
    }
  }, [pallets, activeIndex]);

  // Early return if no pallets
  if (!pallets || pallets.length === 0) {
    return null;
  }

  // Clamp index
  const safeIndex = Math.min(activeIndex, pallets.length - 1);
  const activePallet = pallets[safeIndex];

  const totalCartons = activePallet.boxCount;
  const weight = activePallet.estimatedWeight;
  const height = activePallet.estimatedHeight;
  const reversedLayers = [...activePallet.layerBreakdown].reverse();

  return (
    <div className="pallet-view-container">
      <div className="pallet-select">
        {pallets.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={`px-4 py-2 rounded text-sm font-medium border ${
              idx === safeIndex
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            Pallet {idx + 1}
          </button>
        ))}
      </div>

      <div className="pallet-content">
        <div className="pallet-sidebar">
          <h3 className="text-lg font-semibold mb-2">
            Pallet {safeIndex + 1} Details
          </h3>
          <p>Cartons: {totalCartons}</p>
          <p>Weight: {weight} lbs</p>
          <p>Height: {height}"</p>

          <h4 className="mt-4 font-semibold">Layer Breakdown</h4>
          <div className="layer-list">
            {reversedLayers.map((layer, idx) => (
              <div key={idx} className="mb-3 text-sm">
                <strong>Layer {reversedLayers.length - idx}:</strong>
                {Object.entries(layer).map(([sku, count]) => (
                  <div key={sku}>
                    {count} x {sku.split("-")[1] || sku}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="pallet-canvas">
          <Canvas shadows>
            <ambientLight intensity={0.7} />
            <directionalLight
              position={[50, 100, 100]}
              intensity={1}
              castShadow
            />
            <PerspectiveCamera
              makeDefault
              position={[100, 150, 250]}
              fov={55}
            />
            <OrbitControls />
            <PalletStack pallet={activePallet} />
          </Canvas>
        </div>
      </div>
    </div>
  );
};

export default ThreeDPalletView;
