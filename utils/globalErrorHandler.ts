/*
 글로벌 JS 오류 및 미처리 Promise 거절 핸들러 설정.
 릴리즈(TestFlight) 환경에서 초기화/렌더 중 발생하는 예외를 수집하기 위해 사용.
*/

// RN 전역 에러 핸들러
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setGlobalErrorHandler = () => {
  // 일부 환경에서 ErrorUtils가 존재하지 않을 수 있어 안전 가드
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyGlobal: any = globalThis as unknown as any;

  if (anyGlobal.ErrorUtils && typeof anyGlobal.ErrorUtils.setGlobalHandler === 'function') {
    anyGlobal.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      try {
        // 여기에 Sentry 또는 서버 로깅 연동 가능
        // 현재는 콘솔 로깅으로 남김
        // eslint-disable-next-line no-console
        console.error('[GlobalError]', { message: error?.message, stack: error?.stack, isFatal: !!isFatal });
      } catch {}
    });
  }

  // 미처리 Promise 거절 핸들링
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (anyGlobal as any).onunhandledrejection = (event: any) => {
    try {
      const reason = event?.reason ?? event;
      // eslint-disable-next-line no-console
      console.error('[UnhandledRejection]', {
        message: reason?.message ?? String(reason),
        stack: reason?.stack,
      });
    } catch {}
  };
};

setGlobalErrorHandler();

export {};


