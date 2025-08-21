
// 이 파일은 더 이상 사용되지 않습니다.
// AppContext의 showAlert를 직접 사용하거나, 
// 각 컴포넌트에서 useAppContext().showAlert를 사용하세요.

export const showAlert = () => {
  console.warn('showAlert is deprecated. Use useAppContext().showAlert instead.');
};

export const showConfirmAlert = () => {
  console.warn('showConfirmAlert is deprecated. Use useAppContext().showAlert instead.');
};

export const showErrorAlert = () => {
  console.warn('showErrorAlert is deprecated. Use useAppContext().showAlert instead.');
};

export const showSuccessAlert = () => {
  console.warn('showSuccessAlert is deprecated. Use useAppContext().showAlert instead.');
};
