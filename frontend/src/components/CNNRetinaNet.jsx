import PredictionDashboard from './PredictionDashboard';

function CNNRetinaNet() {
  return (
    <PredictionDashboard
      modelKey="cnn"
      modelName="CNN Classifier"
      title="CNN Analysis"
      description="Convolutional neural network inference for diabetic retinopathy screening backed by the current prediction workflow."
      accent="blue"
    />
  );
}

export default CNNRetinaNet;
