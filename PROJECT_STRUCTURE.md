# 프로젝트 구조 문서 (Project Structure Documentation)

이 문서는 `SmileFood` 프로젝트의 디렉토리 구조와 주요 파일들의 역할을 설명합니다.

## 📁 루트 디렉토리 (Root Directory)

| 디렉토리/파일 | 설명 |
| --- | --- |
| `.expo/` | Expo 관련 설정 및 캐시 파일이 저장되는 디렉토리입니다. |
| `.github/` | GitHub Action 워크플로우 및 관련 설정이 포함됩니다. |
| `android/` | React Native Android 네이티브 프로젝트 파일들이 위치합니다. |
| `ios/` | React Native iOS 네이티브 프로젝트 파일들이 위치합니다. |
| `app/` | Expo Router 기반의 애플리케이션 화면 및 라우팅 로직이 위치합니다. |
| `components/` | 재사용 가능한 UI 컴포넌트들이 위치합니다. |
| `contexts/` | 전역 상태 관리를 위한 Context 파일들이 위치합니다. |
| `services/` | API 호출 등 외부 서비스와의 통신 로직이 포함됩니다. |
| `utils/` | 애플리케이션 전반에서 사용되는 유틸리티 함수들이 위치합니다. |
| `hooks/` | 커스텀 React Hook들이 위치합니다. |
| `styles/` | 전역 스타일 및 스타일 관련 정의가 포함됩니다. |
| `assets/` | 이미지, 폰트 등 정적 리소스 파일들이 위치합니다. |
| `package.json` | 프로젝트 의존성 및 스크립트가 정의된 파일입니다. |
| `app.json` | Expo 프로젝트 설정 파일입니다. |

---

## 📂 `app/` (Screens & Routing)

Expo Router를 사용하여 파일 시스템 기반 라우팅을구현합니다.

| 파일 | 설명 |
| --- | --- |
| `_layout.tsx` | 전역 레이아웃 및 네비게이션 설정을 정의합니다. Root Provider 등이 이곳에 위치할 수 있습니다. |
| `index.tsx` | 애플리케이션의 진입점(메인 화면)입니다. |
| `login.tsx` | 로그인 화면입니다. |
| `register.tsx` | 회원가입 화면입니다. |
| `onboarding.tsx` | 온보딩 화면입니다. |
| `chat-list.tsx` | 채팅 목록 화면입니다. |
| `chat-detail.tsx` | 개별 채팅 상세 화면입니다. |
| `food-detail.tsx` | 음식 상세 정보 화면입니다. |
| `BarcodeScan.tsx` | 바코드 스캔 기능 화면입니다. |
| `profile-edit.tsx` | 프로필 수정 화면입니다. |
| `settings.tsx` | 설정 화면입니다. |
| `menuButtonAndModal.tsx` | 메뉴 버튼 및 모달 관련 컴포넌트/화면입니다. |
| `+not-found.tsx` | 404 에러 페이지입니다. |

---

## 📂 `components/` (UI Components)

화면을 구성하는 재사용 가능한 컴포넌트들입니다.

| 파일 | 설명 |
| --- | --- |
| `SmileFoodLogo.tsx` | 애플리케이션 로고 컴포넌트입니다. |
| `CustomAlert.tsx` | 커스텀 알림창 컴포넌트입니다. |
| `FloatingActionButton.tsx` | 플로팅 액션 버튼(FAB) 컴포넌트입니다. |
| `FoodItem.tsx` | 음식 아이템을 표시하는 컴포넌트입니다. |
| `SafeAreaWrapper.tsx` | 안전 영역(Safe Area)을 처리하는 래퍼 컴포넌트입니다. |
| `ParallaxScrollView.tsx` | 시차(Parallax) 효과가 적용된 스크롤 뷰 컴포넌트입니다. |
| `ThemedText.tsx` | 테마가 적용된 텍스트 컴포넌트입니다. |
| `ThemedView.tsx` | 테마가 적용된 뷰 컴포넌트입니다. |

---

## 📂 `services/` (Data Services)

백엔드 API와의 통신을 담당합니다.

| 파일 | 설명 |
| --- | --- |
| `api.ts` | Axios 등을 사용한 API 호출 함수들이 정의되어 있습니다. (인증, 데이터 페칭 등) |

---

## 📂 `contexts/` (State Management)

전역 상태를 관리합니다.

| 파일 | 설명 |
| --- | --- |
| `AppContext.tsx` | 앱의 전반적인 상태(유저 정보, 설정 등)를 관리하는 Context API 프로바이더입니다. |

---

## 📂 `utils/` (Utilities)

헬퍼 함수 및 공통 로직 모음입니다.

| 파일 | 설명 |
| --- | --- |
| `storage.ts` | 로컬 스토리지(AsyncStorage 등) 관련 유틸리티입니다. |
| `auth.ts` | 인증 토큰 관리, 로그인 상태 확인 등 인증 관련 유틸리티입니다. |
| `alert.ts` | 알림 표시 관련 유틸리티입니다. |
| `imageCache.ts` | 이미지 캐싱 관련 로직을 처리합니다. |
| `globalErrorHandler.ts` | 전역 에러 핸들링 함수입니다. |

---

## 📂 `hooks/` (Custom Hooks)

(현재 디렉토리 내용을 기반으로 추정)

- React Query 혹은 커스텀 로직을 캡슐화한 Hook들이 위치할 것으로 예상됩니다.
