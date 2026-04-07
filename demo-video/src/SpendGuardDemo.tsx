import { Audio, Sequence, staticFile } from "remotion";
import { Intro } from "./scenes/Intro";
import { Architecture } from "./scenes/Architecture";
import { PaymentFlow } from "./scenes/PaymentFlow";
import { BlockedPayment } from "./scenes/BlockedPayment";
import { KillSwitch } from "./scenes/KillSwitch";
import { AuditLog } from "./scenes/AuditLog";
import { Closing } from "./scenes/Closing";

// 90 seconds at 30fps = 2700 frames
// Scene allocation:
//   Intro:          0:00-0:12  =   0-360
//   Architecture:   0:12-0:24  = 360-720
//   PaymentFlow:    0:24-0:40  = 720-1200
//   BlockedPayment: 0:40-0:52  = 1200-1560
//   KillSwitch:     0:52-1:06  = 1560-1980
//   AuditLog:       1:06-1:20  = 1980-2400
//   Closing:        1:20-1:30  = 2400-2700

// Audio:
//   public/music.mp3     — Background music (royalty-free, ambient/tech)
//   public/narration.mp3 — Voice narration (record per NARRATION_SCRIPT.md)
//
// Replace the silent placeholders with your own files.
// Music plays at 15% volume so narration is clear.

export const SpendGuardDemo = () => {
  return (
    <>
      {/* Background music — low volume, full duration */}
      <Audio src={staticFile("music.mp3")} volume={0.15} />

      {/* Voice narration — full volume, full duration */}
      <Audio src={staticFile("narration.mp3")} volume={1.0} />

      <Sequence from={0} durationInFrames={360} premountFor={30}>
        <Intro />
      </Sequence>
      <Sequence from={360} durationInFrames={360} premountFor={30}>
        <Architecture />
      </Sequence>
      <Sequence from={720} durationInFrames={480} premountFor={30}>
        <PaymentFlow />
      </Sequence>
      <Sequence from={1200} durationInFrames={360} premountFor={30}>
        <BlockedPayment />
      </Sequence>
      <Sequence from={1560} durationInFrames={420} premountFor={30}>
        <KillSwitch />
      </Sequence>
      <Sequence from={1980} durationInFrames={420} premountFor={30}>
        <AuditLog />
      </Sequence>
      <Sequence from={2400} durationInFrames={300} premountFor={30}>
        <Closing />
      </Sequence>
    </>
  );
};
