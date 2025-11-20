
import { useState, useEffect, useCallback, useRef } from 'react';
import { RITUAL_STAGES } from '../constants';
import { RitualStage } from '../types';

export const useRitualMotor = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState<RitualStage | null>(null);
  const stageIndexRef = useRef(0);
  const timerIdRef = useRef<number | null>(null);

  const nextStage = useCallback(() => {
    const stage = RITUAL_STAGES[stageIndexRef.current];
    setCurrentStage(stage);
    
    stageIndexRef.current = (stageIndexRef.current + 1) % RITUAL_STAGES.length;

    if (timerIdRef.current) {
        window.clearTimeout(timerIdRef.current);
    }
    
    timerIdRef.current = window.setTimeout(nextStage, stage.duration * 1000);
  }, []);

  const startRitual = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    stageIndexRef.current = 0;
    nextStage();
  }, [isRunning, nextStage]);

  const stopRitual = useCallback(() => {
    if (!isRunning) return;
    if (timerIdRef.current) {
      window.clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
    setIsRunning(false);
    setCurrentStage(null);
  }, [isRunning]);
  
  useEffect(() => {
      return () => {
          if (timerIdRef.current) {
              window.clearTimeout(timerIdRef.current);
          }
      }
  }, []);


  return { isRunning, currentStage, startRitual, stopRitual };
};