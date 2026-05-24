import { useCallback, useEffect, useRef, useState } from "react";
import { categories, shuffle } from "./data";
import { useDeviceOrientation } from "./useGyro";

interface GameScreenProps {
  categoryIds: string[];
  onBack: () => void;
}

function getOrientationAngle(): number {
  const s = screen.orientation;
  if (!s) return 0;
  return s.angle ?? 0;
}

function getLogicalTilt(gamma: number, angle: number): number | null {
  // Landscape left
  if (angle === 90) {
    return gamma;
  }

  // Landscape right
  if (angle === -90 || angle === 270) {
    return -gamma;
  }

  // Ignore portrait
  return null;
}

export function GameScreen({ categoryIds, onBack }: GameScreenProps) {
  const { alpha, beta, gamma, perm, request } = useDeviceOrientation();

  const [phase, setPhase] = useState<"start" | "playing" | "done">("start");

  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [pass, setPass] = useState(0);

  const [lastGesture, setLastGesture] = useState<"correct" | "pass" | null>(
    null,
  );

  const [landscape, setLandscape] = useState(false);

  const [orientationAngle, setOrientationAngle] = useState(getOrientationAngle);

  // Prevent repeat triggers until back in neutral
  const triggered = useRef(false);

  const selectedCategories = categories.filter((c) =>
    categoryIds.includes(c.id),
  );

  const allWords = shuffle(selectedCategories.flatMap((c) => c.words));

  const currentWord = allWords[index];

  const isDone = index >= allWords.length;

  useEffect(() => {
    if (isDone && phase === "playing") {
      setPhase("done");
    }
  }, [isDone, phase]);

  useEffect(() => {
    const check = () => {
      setLandscape(window.screen.width > window.screen.height);

      setOrientationAngle(getOrientationAngle());
    };

    check();

    window.addEventListener("resize", check);

    window.addEventListener("orientationchange", check);

    return () => {
      window.removeEventListener("resize", check);

      window.removeEventListener("orientationchange", check);
    };
  }, []);

  const advance = useCallback((gesture: "correct" | "pass") => {
    if (gesture === "correct") {
      setCorrect((c) => c + 1);
    } else {
      setPass((p) => p + 1);
    }

    setLastGesture(gesture);

    setTimeout(() => {
      setLastGesture(null);
      setIndex((i) => i + 1);
    }, 500);
  }, []);

  // Tilt gesture detection
  useEffect(() => {
    if (phase !== "playing") return;
    if (gamma == null) return;

    const logicalTilt = getLogicalTilt(gamma, orientationAngle);

    // Ignore portrait mode
    if (logicalTilt == null) return;

    // Rearm once back in neutral zone
    if (Math.abs(logicalTilt) < 15) {
      triggered.current = false;
      return;
    }

    // Ignore repeated triggers
    if (triggered.current) return;

    // Phone tilted downward
    if (logicalTilt > 40) {
      triggered.current = true;
      advance("correct");
    }

    // Phone tilted upward
    else if (logicalTilt < -40) {
      triggered.current = true;
      advance("pass");
    }
  }, [gamma, orientationAngle, phase, advance]);

  if (phase === "start") {
    return (
      <div className="game-screen start">
        <h2>Heads Up!</h2>

        <p className="instructions">
          Rotate your phone to landscape and hold it to your forehead.
        </p>

        <SensorInfo
          alpha={alpha}
          beta={beta}
          gamma={gamma}
          angle={orientationAngle}
          landscape={landscape}
          perm={perm}
        />

        <button
          className="start-btn"
          onClick={async () => {
            if (perm === "unknown") {
              await request();
            }

            setPhase("playing");
          }}
        >
          {perm === "unknown" ? "Enable Gyro & Start" : "Start"}
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const total = correct + pass;

    return (
      <div className="game-screen done">
        <h2>Game Over!</h2>

        <div className="score-big">
          {correct} / {total}
        </div>

        <p>
          {correct} correct out of {total}
        </p>

        <p className="pass-count">Passed: {pass}</p>

        <button className="start-btn" onClick={onBack}>
          Play Again
        </button>
      </div>
    );
  }

  const logicalTilt =
    gamma != null ? getLogicalTilt(gamma, orientationAngle) : null;

  return (
    <div className="game-screen playing">
      <div className="top-bar">
        <button className="back-btn" onClick={onBack}>
          ✕
        </button>

        <span className="score">
          {correct}/{correct + pass}
        </span>

        <span className="sensor-entry" style={{ fontSize: "0.7rem" }}>
          tilt: {logicalTilt?.toFixed(1) ?? "—"}
        </span>
      </div>

      <div className="word-display">
        <span className="word">{currentWord}</span>
      </div>

      <SensorInfo
        alpha={alpha}
        beta={beta}
        gamma={gamma}
        angle={orientationAngle}
        landscape={landscape}
        perm={perm}
      />

      {lastGesture && (
        <div className={`gesture-feedback ${lastGesture}`}>
          {lastGesture === "correct" ? "✓" : "✗"}
        </div>
      )}

      <div className="action-bar">
        <button className="action-btn pass-btn" onClick={() => advance("pass")}>
          Pass
        </button>

        <button
          className="action-btn correct-btn"
          onClick={() => advance("correct")}
        >
          Correct
        </button>
      </div>
    </div>
  );
}

function SensorInfo({
  alpha,
  beta,
  gamma,
  perm,
  landscape,
  angle,
}: {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  perm: string;
  landscape: boolean;
  angle: number;
}) {
  const logicalTilt = gamma != null ? getLogicalTilt(gamma, angle) : null;

  return (
    <div className="sensor-panel">
      <div className="sensor-backend">
        DeviceOrientation
        {perm === "denied" ? " (denied)" : ""}
        {!landscape && <span className="warn"> — rotate to landscape</span>}
      </div>

      <div className="sensor-values">
        <span>α: {alpha?.toFixed(1) ?? "—"}°</span>

        <span>β: {beta?.toFixed(1) ?? "—"}°</span>

        <span>γ: {gamma?.toFixed(1) ?? "—"}°</span>

        <span>∠: {angle}°</span>

        <span>tilt: {logicalTilt?.toFixed(1) ?? "—"}</span>
      </div>
    </div>
  );
}
