import React, { useEffect, useRef, useState } from 'react';
import ChromeDinoGame from 'react-chrome-dino';
import Webcam from 'react-webcam';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';

function App() {
  const webcamRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const [lastY, setLastY] = useState(null);
  const [counter, setCounter] = useState(0)
  const jumpThreshold = 10;

  useEffect(() => {
    // setup tensorflow detecor
    const loadDetector = async () => {
      await tf.setBackend('webgl');
      await tf.ready();

      const det = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: 'SinglePose.Lightning',
        }
      );
      setDetector(det);
    };

    loadDetector();
  }, []);

  useEffect(() => {
    if (!detector) return;

    // Detect pose
    let animationFrameId;
    const detectPose = async () => {
      if (
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4
      ) {
        const video = webcamRef.current.video;
        const poses = await detector.estimatePoses(video);
        const keypoints = poses[0]?.keypoints;
        const leftHip = keypoints?.find(k => k.name === 'left_hip');

        if (leftHip?.score > 0.5) {
          const newY = leftHip.y;
          if (lastY && lastY - newY > jumpThreshold) {
            simulateJump();
          }
          setLastY(newY);
        }
      }
      animationFrameId = requestAnimationFrame(detectPose);
    };

    detectPose();

    return () => cancelAnimationFrame(animationFrameId);
  }, [detector, lastY])

  const simulateJump = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { 'keyCode': 32, 'which': 32 }));
    setCounter(counter + 1)
    const p = document.getElementById('jumping');
    p.style.visibility = 'visible';
    setTimeout(() => {
      p.style.visibility = 'hidden';
    }, 1000);
  };

  return (
    <div onClick={() => setCounter(0)} style={{ maxWidth: 600, margin: 'auto' }}>
      <h1>Dino Game</h1>
      <p>Jump counter: {counter}</p>
      <ChromeDinoGame />
      <div style={{ display: 'flex', flexDirection: 'column', margin: 'auto', maxWidth: 300, paddingTop: '10px' }}>
        <p style={{ width: '100%', textAlign: 'center', fontWeight: 700, margin: 0, height: 25, visibility: 'hidden' }} id='jumping'>Jumping!</p>
        <Webcam ref={webcamRef} audio={false} mirrored={true} videoConstraints={{ width: 300, height: 220 }} />
      </div>
    </div>
  );
}

export default App;