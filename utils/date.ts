/**
 * 날짜 포맷팅 유틸리티
 * 외부 라이브러리 없이 날짜를 한국어 형식으로 포맷합니다.
 */

/**
 * 날짜 문자열을 한국어 로케일 형식으로 변환합니다.
 * @param dateString - ISO 8601 형식의 날짜 문자열
 * @returns "YYYY. M. D. 오전/오후 H:MM:SS" 형식의 문자열
 */
export const formatDateKR = (dateString: string): string => {
    try {
        return new Date(dateString).toLocaleString('ko-KR');
    } catch {
        return dateString;
    }
};

/**
 * 날짜 문자열을 "YYYY.MM.DD" 형식으로 변환합니다.
 * @param dateString - ISO 8601 형식의 날짜 문자열
 * @returns "YYYY.MM.DD" 형식의 문자열
 */
export const formatDateShort = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}.${month}.${day}`;
    } catch {
        return dateString;
    }
};
