# 0. 시작하기 (Getting Started)
```bash
# 의존성 패키지 설치
$ npm install

# 프로젝트 실행 (Expo)
$ npm start
# 또는 
$ npx expo start

# Android / iOS 네이티브 실행 시
$ npm run android
$ npm run ios
```

<br/>
<br/>

# 1. 프로젝트 개요 (Project Overview)
- **프로젝트 이름**: 스마일푸드 (SmileFood)
- **프로젝트 설명**: 냉장고 속 식재료의 소비기한을 체계적으로 관리하고, 소비기한이 임박한 식재료를 활용해 AI가 맞춤형 레시피를 추천해 주는 스마트한 식재료 관리 모바일 애플리케이션입니다. 

<br/>
<br/>

# 2. 팀원 및 팀 소개 (Team Members)
| 이건희 | 조성현 | 옥지윤 | 박현성 |
|:------:|:------:|:------:|:------:|
| <img src="https://avatars.githubusercontent.com/u/79556905?v=4" alt="이건희" width="150"> | <img src="https://avatars.githubusercontent.com/u/133869563?v=4" alt="조성현" width="150"> | <img src="https://avatars.githubusercontent.com/u/106373575?v=4" alt="옥지윤" width="150"> | <img src="https://avatars.githubusercontent.com/u/106373575?v=4" alt="박현성" width="150"> |
| PL, FE/BE | FE | 문서 | 문서 |
| [GitHub](https://github.com/szkotgh) | [GitHub](https://github.com/chosungh) | [GitHub](https://github.com/) | [GitHub](https://github.com/) |

<br/>
<br/>

# 3. 주요 기능 (Key Features)
- **회원가입 및 로그인**:
  - 사용자 인증 정보를 통해 가입 및 로그인 기능을 제공하며, 유저 정보를 효과적으로 연동합니다.

- **식재료 관리 (냉장고 메인 화면)**:
  - 현재 보유 중인 식재료를 추가, 수정, 삭제하는 기능을 제공합니다.
  - 식재료의 소비기한을 바탕으로 필터링 및 이름 검색 기능을 제공합니다. (소비기한 임박도에 따른 UI 차등 표시)
  - 페이지네이션 및 로컬 캐싱을 이용해 데이터 리스트 렌더링을 최적화.

- **바코드 스캔 기능**:
  - 스마트폰 카메라로 상품 바코드를 인식해 식재료를 손쉽게 추가할 수 있는 기능을 제공합니다.

- **AI 맞춤형 레시피 추천 (채팅 봇)**:
  - 보유한 식재료 정보를 바탕으로 AI 챗봇이 사용자와 소통하며 맞춤 요리 레시피를 추천 및 안내합니다.

<br/>
<br/>

# 4. 작업 및 역할 분담 (Tasks & Responsibilities)
| 이름 | 포지션 | 주요 담당 업무 |
|-----------------|-----------------|-----------------|
| 이건희    |  <img src="https://github.com/user-attachments/assets/c1c2b1e3-656d-4712-98ab-a15e91efa2da" alt="이동규" width="100"> | <ul><li>프로젝트 계획 및 관리</li></ul>     |
| 조성현   |  <img src="https://github.com/user-attachments/assets/78ec4937-81bb-4637-975d-631eb3c4601e" alt="신유승" width="100">| <ul><li>메인 페이지(식재료 리스트, 정렬 및 필터링) 시스템 개발</li><li>바코드 스캔 구현 (Expo Camera 활용)</li><li>컴포넌트 개발</li><li>UI/UX 수정</ul> |
| 옥지윤   |  <img src="https://avatars.githubusercontent.com/u/106373575?v=4" alt="옥지윤" width="100">    |<ul><li>문서</ul>  |
| 박현성    |  <img src="https://avatars.githubusercontent.com/u/106373575?v=4" alt="박현성" width="100">    | <ul><li>문서</ul>    |

<br/>
<br/>

# 5. 기술 스택 (Technology Stack)

## 5.1 Mobile Frontend
| 기술 | 설명 |
|-----------------|-----------------|
| React Native    | <img src="https://github.com/user-attachments/assets/bfb7db30-3bfd-42d1-83fc-52ebbd246c38" alt="Typescript" width="100"> |
| Expo    | <img src="https://github.com/user-attachments/assets/57a319f9-8997-4673-b894-a9567ee54718" alt="Expo" width="100"> |
| Typescript    | <img src="https://github.com/user-attachments/assets/2c19a96d-8775-484b-a7e7-e984f3a65676" alt="Typescript" width="100"> |

<br/>

## 5.2 Backend & Services
| 기술 | 설명 |
|-----------------|-----------------|
| CloudFlare    |  <img src="https://github.com/user-attachments/assets/6510b6b8-33aa-4856-a737-7205a11a5b2e" alt="CloudFlare" width="100"> |
| Nginx    | <img src="https://nginxstore.com/wp-content/uploads/2024/06/nginx-svgrepo-com.svg" alt="Nginx" width="100"> |
| Docker    | <img src="https://github.com/user-attachments/assets/1c17cf59-59d1-45bb-99fa-f5d83b9df711" alt="Docker" width="100"> |
| FastAPI    | <img src="https://github.com/user-attachments/assets/6e939e91-e667-45e3-bc0d-d2f2251e404a" alt="FastAPI" width="200"> |
| PostgreSQL    | <img src="https://github.com/user-attachments/assets/b63ac61e-8d8d-4e93-b0bf-5ca3b8e135c3" alt="PostgreSQL" width="100"> |

<br/>

## 5.3 Cooperation
| 툴 | 설명 |
|-----------------|-----------------|
| Git / GitHub | 형상 관리 |
| Notion | 개발 워크플로우 추적 및 문서화 |

<br/>

# 6. 프로젝트 구조 (Project Structure)
상세한 주요 파일 구조 및 설명은 폴더 내의 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) 문서를 참고해 주십시오.
```plaintext
smilefood/
├── app/               # Expo Router 기반 메인 화면 라우터 디렉토리
├── assets/            # 이미지, 폰트 다운로드 등 정적 리소스 파일 모음
├── components/        # 애플리케이션 전역에서 사용되는 재사용 UI 컴포넌트
├── contexts/          # Context API 스토어 (앱의 상태를 관리)
├── hooks/             # 커스텀 훅 (재사용 가능한 비즈니스/상태 로직)
├── services/          # API 통신, 외부 데이터 조작 함수
├── styles/            # 테마, 색상 등 전역 스타일과 관련된 사항들
├── utils/             # 앱에서 공통적으로 쓰이는 헬퍼 함수
└── PROJECT_STRUCTURE.md # 앱의 상세파일들 명시
```