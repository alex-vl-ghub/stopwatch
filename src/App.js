import { useState, useEffect } from 'react';
import { timer, merge, Subject, switchMap, EMPTY } from 'rxjs';
import { map } from 'rxjs/operators';
import Button from './components/Button/Button';
import styles from './App.module.scss';

const timer$ = timer(0, 1000);

// Observables for buttons
const startStop$ = new Subject();
const reset$ = new Subject();
const wait$ = new Subject();

// Merging observables for buttons
const buttonsClicks$ = merge(startStop$, wait$, reset$).pipe(
  switchMap((data) => {
    const {
      buttonName,
      time,
      isRun,
      isWait,
      setTime,
      setIsRun,
      setIsWait,
      prevClickTime,
      clickTime,
    } = data;

    // Start
    if (buttonName === 'start' && !isRun && !isWait) {
      setIsRun(true);
      return timer$;
    }

    // Start after Wait
    if (buttonName === 'start' && !isRun && isWait) {
      setIsRun(true);
      setIsWait(false);
      return timer$.pipe(
        map((second) => {
          return second + time;
        }),
      );
    }

    // Stop 
    if (buttonName === 'start' && isRun) {
      setIsRun(false);
      setTime(0);
      return EMPTY;
    }

    // Wait
    if (buttonName === 'wait') {
      console.log('clickTime - prevClickTime', clickTime - prevClickTime);

      setIsRun(false);
      setIsWait(true);
      setTime((prevTime) => {
        return prevTime;
      });
      return EMPTY;
    }

    // Reset
    if (buttonName === 'reset') {
      setIsRun(true);
      setIsWait(false);
      setTime(0);
      return timer$;
    }
  }),
);

function App() {
  const [time, setTime] = useState(0);
  const [isRun, setIsRun] = useState(false);
  const [isWait, setIsWait] = useState(false);
  const [prevClickTime, setPrevClickTime] = useState(0);

  const stateSetters = {
    setTime,
    setIsRun,
    setIsWait,
    setPrevClickTime,
  };

  const state = {
    time,
    isRun,
    isWait,
    prevClickTime,
  };

  // Subscription to buttons clicks
  useEffect(() => {
    const obButtonsClicks$ = buttonsClicks$.subscribe((seconds) => {
      setTime(seconds);
    });

    return () => {
      obButtonsClicks$.unsubscribe();
    };
  }, []);

  // Start button handler
  const startStopHandler = () => {
    startStop$.next({
      buttonName: 'start',
      ...stateSetters,
      ...state,
    });
  };

  // Wait button handler
  const waitHandler = () => {
    // If delay between clicks >= 300ms return
    const clickTime = Date.now();
    const delay = clickTime - prevClickTime;

    setPrevClickTime(clickTime);
    if (delay >= 300) {
      return;
    }

    // Send event to stream only if delay < 300ms
    wait$.next({
      buttonName: 'wait',
      clickTime: Date.now(),
      ...stateSetters,
      ...state,
    });
  };

  // Reset button handler
  const resetHandler = () => {
    reset$.next({ buttonName: 'reset', ...stateSetters, ...state });
  };

  // Formatting seconds to HH:MM:SS
  const dateFromStart = new Date(time * 1000);
  const dial = dateFromStart.toLocaleString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
  });

  return (
    <div className={styles.app}>
      <h1 className={styles.heading}>Stopwatch</h1>
      <div className={styles.dial}>{dial}</div>
      <div className={styles.buttons}>
        <Button clickHandler={startStopHandler}>Start/Stop</Button>
        <Button clickHandler={waitHandler}>Wait</Button>
        <Button clickHandler={resetHandler}>Reset</Button>
      </div>
    </div>
  );
}

export default App;
