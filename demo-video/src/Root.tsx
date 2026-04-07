import { Composition } from "remotion";
import { SpendGuardDemo } from "./SpendGuardDemo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="SpendGuardDemo"
      component={SpendGuardDemo}
      durationInFrames={2700}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
