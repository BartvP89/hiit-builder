/* Exercise library.
   A pose is 22 numbers (11 joints, x,y each) on a 200x150 stage with the floor at y=140:
   head, neck, hip, elbow1, wrist1, elbow2, wrist2, knee1, foot1, knee2, foot2.
   Limb 1 is drawn in front, limb 2 behind. Side views face right.
   frames: [pose, ms] pairs; ms is the time taken to move on to the next pose (loops). */
(() => {
  const shift = (p, dx, dy) => p.map((v, i) => (i % 2 ? v + dy : v + dx));
  const swap = p => [
    ...p.slice(0, 6),
    ...p.slice(10, 14), ...p.slice(6, 10),
    ...p.slice(18, 22), ...p.slice(14, 18),
  ];
  const mirror = p => swap(p.map((v, i) => (i % 2 ? v : 200 - v)));

  const STAND = [100,36, 100,48, 100,88, 101,68, 104,87, 99,68, 100,88, 102,114, 100,140, 100,114, 98,140];
  const SQUAT = [105,64, 100,75, 81,110, 117,80, 135,76, 116,81, 134,78, 107,115, 100,140, 105,115, 98,140];
  const JUMP = [100,20, 100,32, 100,72, 96,52, 90,70, 95,52, 88,69, 101,98, 102,124, 100,98, 100,124];
  const JUMP_UP = [100,26, 100,38, 100,78, 102,19, 103,0, 100,19, 101,0, 101,104, 101,130, 100,104, 99,130];
  const PLANK_HI = [141,96, 130,100, 95,117, 130,120, 130,140, 128,120, 128,140, 73,129, 50,140, 73,129, 52,140];
  const PUSH_LO = [141,125, 130,128, 95,133, 116,120, 130,140, 114,120, 128,140, 73,137, 50,140, 73,137, 52,140];
  const PLANK_A = [140,118, 128,120, 90,129, 128,140, 146,140, 126,140, 144,140, 65,134, 40,140, 65,134, 42,140];
  const PLANK_B = [140,117, 128,119, 90,126, 128,140, 146,140, 126,140, 144,140, 65,132, 40,140, 65,132, 42,140];
  const CLIMB = [141,96, 130,100, 95,117, 130,120, 130,140, 128,120, 128,140, 118,124, 100,136, 73,129, 52,140];
  const CROUCH = [129,95, 120,103, 86,118, 125,122, 129,140, 123,122, 127,140, 110,117, 98,140, 108,117, 96,140];
  const KNEE_UP = [100,34, 100,46, 100,86, 90,62, 84,80, 109,62, 121,50, 125,82, 121,108, 100,112, 99,138];
  const LUNGE = [100,56, 100,68, 100,108, 101,88, 103,106, 99,88, 101,107, 125,113, 124,140, 90,132, 66,138];
  const SIT_DOWN = [48,133, 60,134, 100,134, 56,124, 50,128, 57,125, 51,129, 122,118, 138,140, 120,118, 136,140];
  const SIT_UP = [90,83, 92,95, 100,134, 102,100, 114,104, 101,101, 113,106, 122,118, 138,140, 120,118, 136,140];
  const JACK_IN = [100,36, 100,48, 100,88, 92,66, 90,86, 108,66, 110,86, 97,114, 96,140, 103,114, 104,140];
  const JACK_OUT = [100,38, 100,50, 100,90, 84,36, 72,20, 116,36, 128,20, 89,115, 78,140, 111,115, 122,140];
  const SKATER = [113,46, 116,58, 124,96, 112,76, 118,94, 132,70, 142,82, 132,118, 130,140, 112,120, 96,128];
  const THRUST_LO = [105,64, 100,75, 81,110, 112,88, 106,72, 110,89, 104,73, 107,115, 100,140, 105,115, 98,140];
  const THRUST_HI = [100,36, 100,48, 100,88, 101,28, 102,8, 99,28, 100,8, 102,114, 100,140, 100,114, 98,140];
  const ROW_LO = [133,66, 122,71, 88,92, 123,91, 124,110, 121,91, 122,110, 98,116, 96,140, 96,116, 94,140];
  const ROW_HI = [133,66, 122,71, 88,92, 110,66, 116,84, 108,66, 114,84, 98,116, 96,140, 96,116, 94,140];
  const SWING_LO = [127,69, 116,74, 84,96, 106,90, 94,106, 105,91, 93,107, 100,116, 98,140, 98,116, 96,140];
  const SWING_HI = [100,36, 100,48, 100,88, 120,49, 140,50, 120,50, 140,51, 102,114, 100,140, 100,114, 98,140];
  const STEP_1 = [94,34, 94,46, 96,86, 95,66, 98,85, 93,66, 94,86, 121,80, 124,108, 96,112, 92,140];
  const INC_HI = [130,63, 122,72, 95,102, 126,90, 130,108, 124,90, 128,108, 78,121, 60,140, 78,121, 62,140];
  const INC_LO = [144,79, 134,86, 102,110, 120,100, 130,108, 118,100, 128,108, 81,125, 60,140, 81,125, 62,140];
  const DIP_HI = [82,58, 82,70, 90,108, 80,90, 78,108, 79,90, 76,108, 114,116, 126,140, 112,116, 124,140];
  const DIP_LO = [84,78, 84,90, 90,128, 66,96, 78,108, 65,96, 76,108, 114,118, 126,140, 112,118, 124,140];
  // Set both arms at once (arm 2 sits just behind arm 1).
  const arms = (p, ex, ey, wx, wy) => [...p.slice(0, 6), ex, ey, wx, wy, ex - 2, ey + 1, wx - 2, wy + 1, ...p.slice(14)];
  const BUTT = [100,34, 100,46, 100,86, 109,62, 121,50, 90,62, 84,80, 103,112, 82,102, 100,112, 99,138];
  const TUCK = [100,14, 100,26, 100,64, 108,44, 120,56, 106,45, 118,57, 120,52, 118,78, 118,53, 116,79];
  const BRIDGE_LO = [48,133, 60,134, 100,134, 80,138, 100,139, 79,138, 99,139, 120,116, 132,140, 118,116, 130,140];
  const BRIDGE_HI = [50,134, 62,132, 98,112, 80,137, 100,139, 79,137, 99,139, 121,114, 132,140, 119,114, 130,140];
  const SUPER_LO = [146,131, 134,134, 94,134, 154,135, 174,136, 152,135, 172,136, 68,135, 42,136, 68,135, 44,136];
  const SUPER_HI = [145,118, 133,124, 94,134, 153,120, 172,112, 151,121, 170,114, 69,130, 44,120, 69,131, 46,122];
  const PIKE_HI = [140,110, 133,100, 98,92, 131,120, 130,140, 129,120, 128,140, 85,116, 72,140, 85,116, 74,140];
  const PIKE_LO = [146,130, 136,120, 100,96, 120,128, 130,140, 118,128, 128,140, 86,118, 72,140, 86,118, 74,140];
  const SIDE_LUNGE = [110,52, 110,64, 112,104, 99,78, 108,86, 121,78, 112,86, 93,122, 74,140, 130,112, 130,140];
  const V_LO = [48,133, 60,134, 100,134, 42,130, 24,132, 43,131, 25,133, 126,135, 152,136, 126,136, 152,137];
  const V_HI = [71,90, 78,100, 100,134, 96,98, 114,96, 95,99, 113,98, 119,116, 138,98, 118,117, 137,100];
  const FOLD = [92,122, 82,116, 54,88, 88,128, 92,140, 86,128, 90,140, 52,114, 50,140, 52,114, 52,140];
  const REN_1 = [141,96, 130,100, 95,117, 120,84, 126,104, 128,120, 128,140, 73,129, 50,140, 73,129, 52,140];
  const REN_2 = [141,96, 130,100, 95,117, 130,120, 130,140, 118,84, 124,104, 73,129, 50,140, 73,129, 52,140];
  const RAISE_HI = [100,36, 100,48, 100,88, 80,50, 60,52, 120,50, 140,52, 97,114, 96,140, 103,114, 104,140];
  const HANG = [102,43, 100,54, 100,94, 100,34, 100,14, 99,34, 99,14, 103,118, 90,136, 102,118, 89,136];
  const PULL_TOP = [93,15, 94,27, 95,67, 102,40, 100,14, 101,40, 99,14, 98,91, 86,109, 97,91, 85,109];
  const KNEE_RAISE = [102,43, 100,54, 100,94, 100,34, 100,14, 99,34, 99,14, 125,90, 122,116, 124,91, 121,117];
  const IROW_LO = [74,120, 86,122, 125,130, 91,103, 96,84, 90,103, 95,84, 150,135, 176,140, 150,135, 176,140];
  const IROW_HI = [88,88, 98,94, 132,114, 92,108, 96,84, 91,108, 95,84, 154,127, 176,140, 154,127, 176,140];
  const TAP = [96,34, 96,46, 96,86, 86,62, 80,80, 105,62, 117,50, 120,82, 118,108, 97,112, 96,138];

  window.EXERCISES = [
    {
      id: 'jumping-jacks', name: 'Jumping jacks', equip: 'body', focus: 'Full body, heart rate', level: 1,
      desc: 'Jump your feet wide while sweeping both arms overhead, then jump back to standing with arms at your sides. Keep a steady, springy rhythm.',
      cues: ['Land softly on the balls of your feet', 'Arms all the way up, all the way down', 'Stay tall, eyes forward'],
      easier: 'Step one foot out at a time instead of jumping.',
      front: true, still: 1,
      frames: [[JACK_IN, 320], [JACK_OUT, 320]],
    },
    {
      id: 'high-knees', name: 'High knees', equip: 'body', focus: 'Legs, core, heart rate', level: 2,
      desc: 'Run on the spot, driving each knee up to hip height. Pump the opposite arm with every step and stay light on your feet.',
      cues: ['Knees up to hip height', 'Quick, light contacts with the floor', 'Stay upright, do not lean back'],
      easier: 'March instead of run, lifting each knee high.',
      still: 0,
      frames: [[KNEE_UP, 230], [swap(KNEE_UP), 230]],
    },
    {
      id: 'air-squats', name: 'Air squats', equip: 'body', focus: 'Quads, glutes', level: 1,
      desc: 'Stand with feet shoulder-width apart. Push your hips back and down until your thighs are about parallel to the floor, then drive up through your heels.',
      cues: ['Chest up, back flat', 'Knees track over your toes', 'Weight in your heels'],
      easier: 'Squat down to a chair or box and stand back up.',
      still: 1,
      frames: [[STAND, 700], [SQUAT, 150], [SQUAT, 600], [STAND, 250]],
    },
    {
      id: 'jump-squats', name: 'Jump squats', equip: 'body', focus: 'Legs, power', level: 3,
      desc: 'Drop into a squat, then explode straight up off the floor. Land softly and sink directly into the next squat.',
      cues: ['Swing your arms to help the jump', 'Land quietly with bent knees', 'Full squat depth each rep'],
      easier: 'Rise onto your toes instead of leaving the floor.',
      still: 2,
      frames: [[STAND, 380], [SQUAT, 220], [JUMP, 260], [SQUAT, 420]],
    },
    {
      id: 'push-ups', name: 'Push-ups', equip: 'body', focus: 'Chest, shoulders, triceps', level: 2,
      desc: 'From a straight-arm plank with hands under your shoulders, lower your chest to just above the floor and press back up. Your body stays in one straight line.',
      cues: ['Elbows about 45 degrees from your sides', 'Squeeze glutes and brace your core', 'No sagging hips'],
      easier: 'Drop to your knees, or use the incline push-up on a box.',
      still: 1,
      frames: [[PLANK_HI, 650], [PUSH_LO, 120], [PUSH_LO, 550], [PLANK_HI, 200]],
    },
    {
      id: 'burpees', name: 'Burpees', equip: 'body', focus: 'Full body, heart rate', level: 3,
      desc: 'Squat down and place your hands on the floor, jump your feet back to a plank, lower your chest, then jump your feet forward and leap up with arms overhead.',
      cues: ['Keep your core tight in the plank', 'Jump feet in close to your hands', 'Find a pace you can hold'],
      easier: 'Step back and forward instead of jumping, and skip the push-up.',
      still: 2,
      frames: [[STAND, 380], [CROUCH, 300], [PLANK_HI, 300], [PUSH_LO, 300], [PLANK_HI, 320], [CROUCH, 280], [JUMP_UP, 300]],
    },
    {
      id: 'mountain-climbers', name: 'Mountain climbers', equip: 'body', focus: 'Core, shoulders, heart rate', level: 2,
      desc: 'Hold a straight-arm plank and drive one knee toward your chest, then switch legs quickly as if running against the floor.',
      cues: ['Shoulders stacked over your wrists', 'Hips level, not piked up', 'Fast feet, steady upper body'],
      easier: 'Step each foot forward slowly instead of running.',
      still: 0,
      frames: [[CLIMB, 240], [swap(CLIMB), 240]],
    },
    {
      id: 'plank', name: 'Plank hold', equip: 'body', focus: 'Core, shoulders', level: 1,
      desc: 'Rest on your forearms and toes with elbows under your shoulders. Hold your body in one straight line from head to heels and keep breathing.',
      cues: ['Pull your belly button toward your spine', 'Squeeze your glutes', 'Look at the floor just ahead of your hands'],
      easier: 'Lower your knees to the floor.',
      still: 0,
      frames: [[PLANK_A, 1400], [PLANK_B, 1400]],
    },
    {
      id: 'reverse-lunges', name: 'Reverse lunges', equip: 'body', focus: 'Quads, glutes, balance', level: 2,
      desc: 'Step one foot back and lower until both knees are bent to about 90 degrees. Push through the front heel to stand, then switch legs.',
      cues: ['Torso tall, shoulders over hips', 'Back knee hovers just above the floor', 'Front knee stays over the ankle'],
      easier: 'Take a shorter step and lower only halfway.',
      still: 1,
      frames: [[STAND, 600], [LUNGE, 600], [STAND, 600], [swap(LUNGE), 600]],
    },
    {
      id: 'sit-ups', name: 'Sit-ups', equip: 'body', focus: 'Abs, hip flexors', level: 1,
      desc: 'Lie on your back with knees bent and feet flat. Curl your torso up toward your knees, then lower back down with control.',
      cues: ['Lead with your chest, not your chin', 'Do not pull on your neck', 'Lower slowly'],
      easier: 'Do crunches: lift only your shoulder blades off the floor.',
      still: 1,
      frames: [[SIT_DOWN, 700], [SIT_UP, 150], [SIT_UP, 700], [SIT_DOWN, 150]],
    },
    {
      id: 'skaters', name: 'Skaters', equip: 'body', focus: 'Glutes, balance, heart rate', level: 2,
      desc: 'Leap sideways onto one foot, sweeping the other leg behind you like a speed skater, then bound straight back to the other side.',
      cues: ['Land softly on a bent knee', 'Reach the opposite hand toward your landing foot', 'Chest lifted'],
      easier: 'Step side to side instead of leaping.',
      front: true, still: 0,
      frames: [[SKATER, 180], [SKATER, 420], [mirror(SKATER), 180], [mirror(SKATER), 420]],
    },
    {
      id: 'thrusters', name: 'Dumbbell thrusters', equip: 'dumbbell', focus: 'Legs, shoulders, heart rate', level: 3,
      desc: 'Hold a dumbbell at each shoulder. Squat down, then stand up fast and use that drive to press both weights overhead in one smooth movement.',
      cues: ['Elbows up in the squat', 'Drive with your legs first, arms finish', 'Lock out overhead, ribs down'],
      easier: 'Use one lighter weight held at your chest, or no weight at all.',
      props: { db: [1, 2] }, still: 2,
      frames: [[THRUST_HI, 600], [THRUST_LO, 150], [THRUST_LO, 500], [THRUST_HI, 250]],
    },
    {
      id: 'db-swings', name: 'Dumbbell swings', equip: 'dumbbell', focus: 'Glutes, hamstrings, back', level: 2,
      desc: 'Hold one dumbbell in both hands. Hinge at the hips to swing it back between your legs, then snap your hips forward to swing it up to chest height.',
      cues: ['The power comes from your hips, not your arms', 'Flat back, soft knees', 'Squeeze your glutes at the top'],
      easier: 'Use a lighter weight and swing only to belly height.',
      props: { db: [1] }, still: 1,
      frames: [[SWING_LO, 480], [SWING_HI, 180], [SWING_HI, 480], [SWING_LO, 120]],
    },
    {
      id: 'bent-over-rows', name: 'Bent-over rows', equip: 'dumbbell', focus: 'Upper back, biceps', level: 1,
      desc: 'Hinge forward with a flat back and a dumbbell in each hand. Pull both weights up to your ribs, squeeze your shoulder blades, and lower with control.',
      cues: ['Back flat, neck long', 'Elbows brush past your sides', 'No jerking with your torso'],
      easier: 'Row one arm at a time with the other hand on a box.',
      props: { db: [1, 2] }, still: 1,
      frames: [[ROW_LO, 550], [ROW_HI, 250], [ROW_HI, 550], [ROW_LO, 200]],
    },
    {
      id: 'weighted-lunges', name: 'Dumbbell lunges', equip: 'dumbbell', focus: 'Quads, glutes, grip', level: 2,
      desc: 'Hold a dumbbell in each hand at your sides. Step back into a lunge until both knees are bent, drive up through the front heel, then switch legs.',
      cues: ['Weights hang straight down', 'Torso stays upright', 'Control the way down'],
      easier: 'Drop the weights and do the bodyweight version.',
      props: { db: [1, 2] }, still: 1,
      frames: [[STAND, 650], [LUNGE, 650], [STAND, 650], [swap(LUNGE), 650]],
    },
    {
      id: 'box-jumps', name: 'Box jumps', equip: 'box', focus: 'Legs, power', level: 3,
      desc: 'Stand facing the box, dip into a quarter squat and jump onto it with both feet. Stand up fully on top, then step back down one foot at a time.',
      cues: ['Land with your whole foot on the box', 'Land soft and quiet', 'Step down, do not jump down'],
      easier: 'Use a lower box, or swap to step-ups.',
      props: { box: [125, 55, 32] }, still: 2,
      frames: [[shift(STAND, -25, 0), 400], [shift(SQUAT, -25, 0), 220], [shift(JUMP, 8, -26), 220], [shift(SQUAT, 45, -32), 380], [shift(STAND, 45, -32), 450], [shift(STAND, 45, -32), 600]],
    },
    {
      id: 'step-ups', name: 'Step-ups', equip: 'box', focus: 'Quads, glutes, heart rate', level: 1,
      desc: 'Place one foot fully on the box, press through that heel to stand up tall on top, then step back down. Alternate the leading leg.',
      cues: ['Push through the top foot, do not spring off the floor', 'Stand all the way up', 'Lower with control'],
      easier: 'Use a lower step and hold on to something for balance.',
      props: { box: [115, 60, 32] }, still: 1,
      frames: [[shift(STAND, -8, 0), 350], [STEP_1, 450], [shift(STAND, 32, -32), 450], [STEP_1, 350], [shift(STAND, -8, 0), 350], [swap(STEP_1), 450], [shift(STAND, 32, -32), 450], [swap(STEP_1), 350]],
    },
    {
      id: 'box-toe-taps', name: 'Box toe taps', equip: 'box', focus: 'Calves, coordination, heart rate', level: 2,
      desc: 'Stand facing the box and lightly tap one foot on its top edge, then switch feet quickly in a running rhythm. Barely put any weight on the box.',
      cues: ['Light, quick taps', 'Stay on the balls of your feet', 'Pump your arms'],
      easier: 'Slow it down and step instead of hopping between taps.',
      props: { box: [112, 60, 32] }, still: 0,
      frames: [[TAP, 220], [swap(TAP), 220]],
    },
    {
      id: 'incline-push-ups', name: 'Incline push-ups', equip: 'box', focus: 'Chest, shoulders, triceps', level: 1,
      desc: 'Put your hands on the edge of the box and walk your feet back into a straight line. Lower your chest to the box and press back up.',
      cues: ['Body in one line, head to heels', 'Chest meets the box, not your chin', 'Press all the way up'],
      easier: 'Use a higher surface such as a table or counter.',
      props: { box: [120, 55, 32] }, still: 1,
      frames: [[INC_HI, 650], [INC_LO, 120], [INC_LO, 550], [INC_HI, 200]],
    },
    {
      id: 'box-dips', name: 'Box dips', equip: 'box', focus: 'Triceps, shoulders', level: 2,
      desc: 'Sit on the edge of the box with hands beside your hips, then slide off so your arms hold you up. Bend your elbows to lower, and press back up.',
      cues: ['Elbows point straight back', 'Hips stay close to the box', 'Shoulders down, away from your ears'],
      easier: 'Keep your knees bent and feet close; lower only a little.',
      props: { box: [25, 55, 32] }, still: 1,
      frames: [[DIP_HI, 600], [DIP_LO, 120], [DIP_LO, 520], [DIP_HI, 200]],
    },
    {
      id: 'butt-kicks', name: 'Butt kicks', equip: 'body', focus: 'Hamstrings, heart rate', level: 1,
      desc: 'Run on the spot, flicking each heel up toward your glutes. Keep your knees pointing down and your steps quick.',
      cues: ['Heels up to your glutes', 'Stay on the balls of your feet', 'Relaxed, pumping arms'],
      easier: 'Walk it: one slow heel flick at a time.',
      still: 0,
      frames: [[BUTT, 220], [swap(BUTT), 220]],
    },
    {
      id: 'tuck-jumps', name: 'Tuck jumps', equip: 'body', focus: 'Legs, power, heart rate', level: 3,
      desc: 'Dip into a quarter squat and jump as high as you can, pulling both knees up toward your chest. Land softly and go again.',
      cues: ['Knees come up to your hands', 'Land softly, knees bent', 'Reset your balance between jumps'],
      easier: 'Do a small jump squat without tucking the knees.',
      still: 2,
      frames: [[STAND, 380], [SQUAT, 220], [TUCK, 320]],
    },
    {
      id: 'lateral-lunges', name: 'Side lunges', equip: 'body', focus: 'Glutes, inner thighs', level: 1,
      desc: 'Take a big step to the side, sit your hips back over that leg and keep the other leg straight. Push back to the middle and switch sides.',
      cues: ['Hips back, chest up', 'Both feet point forward', 'Push off the bent leg to return'],
      easier: 'Take a smaller step and do not sink as low.',
      front: true, still: 1,
      frames: [[JACK_IN, 550], [SIDE_LUNGE, 550], [JACK_IN, 550], [mirror(SIDE_LUNGE), 550]],
    },
    {
      id: 'pike-push-ups', name: 'Pike push-ups', equip: 'body', focus: 'Shoulders, triceps', level: 2,
      desc: 'Start in an upside-down V with hips high and hands on the floor. Bend your elbows to lower the top of your head toward the floor, then press back up.',
      cues: ['Hips stay high the whole time', 'Head moves forward of your hands', 'Elbows track back, not out wide'],
      easier: 'Bend your knees a little, or put your hands on a box.',
      still: 1,
      frames: [[PIKE_HI, 600], [PIKE_LO, 120], [PIKE_LO, 500], [PIKE_HI, 200]],
    },
    {
      id: 'inchworms', name: 'Inchworms', equip: 'body', focus: 'Core, shoulders, hamstrings', level: 1,
      desc: 'Fold forward and put your hands on the floor, walk them out to a straight-arm plank, pause, then walk them back to your feet and stand up.',
      cues: ['Legs as straight as you can manage', 'Brace your core in the plank', 'Small, controlled hand steps'],
      easier: 'Bend your knees as much as you need to reach the floor.',
      still: 2,
      frames: [[shift(STAND, -48, 0), 550], [FOLD, 650], [PLANK_HI, 350], [PLANK_HI, 650], [FOLD, 550]],
    },
    {
      id: 'glute-bridges', name: 'Glute bridges', equip: 'body', focus: 'Glutes, hamstrings', level: 1,
      desc: 'Lie on your back with knees bent and feet flat. Push through your heels to lift your hips until your body is straight from shoulders to knees, squeeze, then lower.',
      cues: ['Squeeze your glutes at the top', 'Do not arch your lower back', 'Heels stay planted'],
      easier: 'Lift only as high as feels comfortable; hold a dumbbell on your hips to make it harder.',
      still: 1,
      frames: [[BRIDGE_LO, 550], [BRIDGE_HI, 300], [BRIDGE_HI, 550], [BRIDGE_LO, 150]],
    },
    {
      id: 'v-ups', name: 'V-ups', equip: 'body', focus: 'Abs, hip flexors', level: 3,
      desc: 'Lie flat with arms stretched overhead. In one movement, lift your legs and torso and reach your hands toward your toes, then lower back down with control.',
      cues: ['Arms and legs leave the floor together', 'Balance on your sit bones at the top', 'Lower slowly, do not flop'],
      easier: 'Bend your knees and tuck them to your chest instead.',
      still: 1,
      frames: [[V_LO, 600], [V_HI, 150], [V_HI, 600], [V_LO, 200]],
    },
    {
      id: 'supermans', name: 'Supermans', equip: 'body', focus: 'Lower back, glutes', level: 1,
      desc: 'Lie face down with arms stretched out in front. Lift your arms, chest and legs off the floor at the same time, hold for a second, and lower.',
      cues: ['Look at the floor, neck long', 'Squeeze glutes and shoulder blades', 'Lift, pause, lower: no jerking'],
      easier: 'Lift only the opposite arm and leg, alternating.',
      still: 1,
      frames: [[SUPER_LO, 500], [SUPER_HI, 500], [SUPER_HI, 500], [SUPER_LO, 200]],
    },
    {
      id: 'goblet-squats', name: 'Goblet squats', equip: 'dumbbell', focus: 'Quads, glutes, core', level: 2,
      desc: 'Hold one dumbbell upright against your chest with both hands. Squat down between your knees, keeping the weight close, then stand back up.',
      cues: ['Elbows point down, weight at your chest', 'Chest tall, back flat', 'Push the floor away to stand'],
      easier: 'Use a lighter weight or squat to a box.',
      props: { db: [1] }, still: 1,
      frames: [[arms(STAND, 104, 68, 110, 56), 700], [arms(SQUAT, 112, 92, 116, 78), 150], [arms(SQUAT, 112, 92, 116, 78), 600], [arms(STAND, 104, 68, 110, 56), 250]],
    },
    {
      id: 'shoulder-press', name: 'Shoulder press', equip: 'dumbbell', focus: 'Shoulders, triceps', level: 2,
      desc: 'Stand tall with a dumbbell at each shoulder. Press both weights straight overhead until your arms are locked out, then lower back to your shoulders.',
      cues: ['Ribs down, glutes tight', 'Weights finish above your ears', 'No leaning back'],
      easier: 'Press one arm at a time, or sit on a box.',
      props: { db: [1, 2] }, still: 1,
      frames: [[arms(STAND, 106, 66, 104, 48), 450], [THRUST_HI, 200], [THRUST_HI, 550], [arms(STAND, 106, 66, 104, 48), 250]],
    },
    {
      id: 'biceps-curls', name: 'Biceps curls', equip: 'dumbbell', focus: 'Biceps, forearms', level: 1,
      desc: 'Stand with a dumbbell in each hand, palms forward. Curl the weights up to your shoulders without moving your elbows, then lower slowly.',
      cues: ['Elbows pinned to your sides', 'No swinging from the hips', 'Lower for a slow count of two'],
      easier: 'Use lighter weights or alternate arms.',
      props: { db: [1, 2] }, still: 1,
      frames: [[STAND, 450], [arms(STAND, 101, 68, 112, 52), 200], [arms(STAND, 101, 68, 112, 52), 600], [STAND, 250]],
    },
    {
      id: 'romanian-deadlifts', name: 'Romanian deadlifts', equip: 'dumbbell', focus: 'Hamstrings, glutes, back', level: 2,
      desc: 'Hold a dumbbell in each hand in front of your thighs. Push your hips back and slide the weights down your legs with a flat back, then drive your hips forward to stand.',
      cues: ['Soft knees, hips travel back', 'Weights stay close to your legs', 'Back flat from head to tailbone'],
      easier: 'Lower only to your knees.',
      props: { db: [1, 2] }, still: 1,
      frames: [[STAND, 700], [ROW_LO, 250], [ROW_LO, 600], [STAND, 300]],
    },
    {
      id: 'renegade-rows', name: 'Renegade rows', equip: 'dumbbell', focus: 'Back, core, shoulders', level: 3,
      desc: 'Hold a straight-arm plank with your hands on two dumbbells. Row one weight up to your ribs while balancing on the other, lower it, and switch sides.',
      cues: ['Feet wide for balance', 'Hips stay square to the floor', 'Pull your elbow straight up'],
      easier: 'Drop to your knees, or row without weights.',
      props: { db: [1, 2] }, still: 1,
      frames: [[PLANK_HI, 400], [REN_1, 400], [PLANK_HI, 400], [REN_2, 400]],
    },
    {
      id: 'lateral-raises', name: 'Lateral raises', equip: 'dumbbell', focus: 'Shoulders', level: 1,
      desc: 'Stand with a light dumbbell in each hand at your sides. Raise both arms out to the sides until they reach shoulder height, then lower slowly.',
      cues: ['Slight bend in the elbows', 'Stop at shoulder height', 'Shoulders stay away from your ears'],
      easier: 'Go lighter than you think; this one burns fast.',
      props: { db: [1, 2] }, front: true, still: 1,
      frames: [[JACK_IN, 500], [RAISE_HI, 250], [RAISE_HI, 650], [JACK_IN, 250]],
    },
    {
      id: 'triceps-extensions', name: 'Overhead triceps extensions', equip: 'dumbbell', focus: 'Triceps', level: 1,
      desc: 'Hold one dumbbell overhead with both hands. Bend your elbows to lower it behind your head, then straighten your arms to press it back up.',
      cues: ['Elbows point forward, close to your head', 'Only your forearms move', 'Brace your core, no arching'],
      easier: 'Use a lighter weight or sit on a box.',
      props: { db: [1] }, still: 1,
      frames: [[arms(STAND, 101, 28, 102, 8), 500], [arms(STAND, 102, 26, 90, 40), 200], [arms(STAND, 102, 26, 90, 40), 450], [arms(STAND, 101, 28, 102, 8), 250]],
    },
    {
      id: 'pull-ups', name: 'Pull-ups', equip: 'rack', focus: 'Back, biceps, grip', level: 3,
      desc: 'Hang from the bar with straight arms. Pull yourself up until your chin clears the bar, then lower all the way back down with control.',
      cues: ['Start every rep from a full hang', 'Pull your elbows down to your ribs', 'No kicking or swinging'],
      easier: 'Jump to the top and lower slowly, or loop a band over the bar.',
      props: { rack: [100, 14, 134] }, still: 1,
      frames: [[HANG, 500], [PULL_TOP, 250], [PULL_TOP, 650], [HANG, 300]],
    },
    {
      id: 'hanging-knee-raises', name: 'Hanging knee raises', equip: 'rack', focus: 'Abs, hip flexors, grip', level: 2,
      desc: 'Hang from the bar with straight arms. Pull your knees up toward your chest without swinging, pause, and lower your legs slowly.',
      cues: ['Shoulders active, not shrugged', 'Curl your hips up at the top', 'Slow on the way down to stop the swing'],
      easier: 'Raise one knee at a time.',
      props: { rack: [100, 14, 134] }, still: 1,
      frames: [[HANG, 450], [KNEE_RAISE, 250], [KNEE_RAISE, 550], [HANG, 300]],
    },
    {
      id: 'inverted-rows', name: 'Inverted rows', equip: 'rack', focus: 'Upper back, biceps, core', level: 2,
      desc: 'Set the bar at about waist height and hang underneath it with heels on the floor and body straight. Pull your chest to the bar, then lower until your arms are straight.',
      cues: ['Body stays in one straight line', 'Squeeze your shoulder blades together', 'Chest touches the bar'],
      easier: 'Raise the bar or bend your knees with feet flat.',
      props: { rack: [96, 84, 96] }, still: 1,
      frames: [[IROW_LO, 450], [IROW_HI, 250], [IROW_HI, 600], [IROW_LO, 250]],
    },
  ];
})();
