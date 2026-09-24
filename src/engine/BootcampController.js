// ==========================================================================
// OFFICER BOOTCAMP CONTROLLER — TACTICAL TRAINING SYSTEM
// ==========================================================================

export const BOOTCAMP_LESSONS = {
  1: {
    id: 1,
    title: 'The WEGO Clock',
    subtitle: 'Movement & Simultaneous Execution',
    duration: '60s',
    description: 'Learn how to select your squad, plot adjacent movement waypoints, and hit End Phase to watch simultaneous execution.',
    steps: [
      {
        stepIndex: 1,
        instruction: 'Click your Rifle Squad at the deployment point (highlighted in gold).',
        requiredAction: 'SELECT_UNIT',
        targetPos: { x: 1, y: 3 },
        pointerPos: { x: 1, y: 3 },
        pointerLabel: '1. Click Squad'
      },
      {
        stepIndex: 2,
        instruction: 'Click adjacent tiles to draw a movement path towards the Flag Extraction Point (Green).',
        requiredAction: 'QUEUE_WAYPOINTS',
        targetPos: { x: 5, y: 3 },
        pointerPos: { x: 5, y: 3 },
        pointerLabel: '2. Plot Path to Flag'
      },
      {
        stepIndex: 3,
        instruction: 'Orders locked! Now click "End Phase" on the top right to execute simultaneous movement.',
        requiredAction: 'END_PHASE',
        targetElementId: 'btn-end-turn',
        pointerLabel: '3. Click End Phase'
      }
    ]
  },
  2: {
    id: 2,
    title: 'Cover & Ambush Stance',
    subtitle: 'Forest Concealment & Stances',
    duration: '60s',
    description: 'Conceal a squad in dense forest with Ambush Stance to spring a surprise attack with 50% reduced return fire.',
    steps: [
      {
        stepIndex: 1,
        instruction: 'Click your Rifle Squad hidden in the Forest corridor.',
        requiredAction: 'SELECT_UNIT',
        targetPos: { x: 2, y: 3 },
        pointerPos: { x: 2, y: 3 },
        pointerLabel: '1. Select Forest Squad'
      },
      {
        stepIndex: 2,
        instruction: 'In the right Inspector panel, verify your squad is in AMBUSH stance (50% cover defense).',
        requiredAction: 'CHECK_STANCE',
        targetPos: { x: 2, y: 3 },
        pointerLabel: '2. Verify Stance'
      },
      {
        stepIndex: 3,
        instruction: 'Click "End Phase" to spring the ambush as the enemy patrol advances into your crosshairs!',
        requiredAction: 'END_PHASE',
        targetElementId: 'btn-end-turn',
        pointerLabel: '3. End Phase'
      }
    ]
  },
  3: {
    id: 3,
    title: 'Supply Depots & Recruiting',
    subtitle: 'War Economy & Reinforcements',
    duration: '90s',
    description: 'Capture a neutral Gold Supply Depot to gain +10 Ink/Turn, open the Recruit Store, and deploy reinforcements to your Base ring.',
    steps: [
      {
        stepIndex: 1,
        instruction: 'Select your fast Scout at your Base.',
        requiredAction: 'SELECT_UNIT',
        targetPos: { x: 1, y: 3 },
        pointerPos: { x: 1, y: 3 },
        pointerLabel: '1. Select Scout'
      },
      {
        stepIndex: 2,
        instruction: 'Click adjacent tiles to draw a path directly onto the Gold Supply Depot (+10 Ink).',
        requiredAction: 'QUEUE_WAYPOINTS',
        targetPos: { x: 4, y: 3 },
        pointerPos: { x: 4, y: 3 },
        pointerLabel: '2. Move to Gold Depot'
      },
      {
        stepIndex: 3,
        instruction: 'Click "End Phase" to advance your Scout and secure the Depot.',
        requiredAction: 'END_PHASE',
        targetElementId: 'btn-end-turn',
        pointerLabel: '3. Capture Depot'
      },
      {
        stepIndex: 4,
        instruction: 'Depot secured! Now click "Rifle Squad" in the Recruit Store below to deploy reinforcements onto your Base ring.',
        requiredAction: 'RECRUIT_UNIT',
        targetElementId: 'store-card-RIFLEMAN',
        pointerLabel: '4. Recruit Squad'
      },
      {
        stepIndex: 5,
        instruction: 'Click "End Phase" to finalize deployment into the field.',
        requiredAction: 'END_PHASE',
        targetElementId: 'btn-end-turn',
        pointerLabel: '5. Finalize Turn'
      }
    ]
  },
  4: {
    id: 4,
    title: 'The Counter Triangle',
    subtitle: 'Rock-Paper-Scissors Combat Matrix',
    duration: '90s',
    description: 'Master rock-paper-scissors: Anti-Tank pierces armor (2.5x), Rifle Squad flanks AT crews, and Armored Cars crush infantry.',
    steps: [
      {
        stepIndex: 1,
        instruction: 'Top Lane: Select your Anti-Tank crew and move to target the Enemy Armored Car (2.5x Armor Penetration!).',
        requiredAction: 'ATTACK_LANE_1',
        pointerPos: { x: 1, y: 1 },
        pointerLabel: '1. AT vs Armored Car'
      },
      {
        stepIndex: 2,
        instruction: 'Mid Lane: Select your Rifle Squad and move to engage the Enemy Anti-Tank crew (Infantry flanks AT crews!).',
        requiredAction: 'ATTACK_LANE_2',
        pointerPos: { x: 1, y: 3 },
        pointerLabel: '2. Rifle vs AT Crew'
      },
      {
        stepIndex: 3,
        instruction: 'Bottom Lane: Select your Armored Car and move to crush the Enemy Rifle Squad (1.5x Crush vs Infantry!).',
        requiredAction: 'ATTACK_LANE_3',
        pointerPos: { x: 1, y: 5 },
        pointerLabel: '3. Vehicle vs Infantry'
      },
      {
        stepIndex: 4,
        instruction: 'All counter-orders locked in! Click "End Phase" to execute the combat turn.',
        requiredAction: 'END_PHASE',
        targetElementId: 'btn-end-turn',
        pointerLabel: '4. Execute Counters'
      }
    ]
  },
  5: {
    id: 5,
    title: 'Graduation Skirmish',
    subtitle: 'Capstone Frontline Certification',
    duration: '2 Min',
    description: 'Combine all skills in a compact frontline battle. Secure the depots, recruit counters, and demolish the enemy HQ to graduate!',
    steps: [
      {
        stepIndex: 1,
        instruction: 'Graduation Exam: Capture the central Gold Supply Depots to fuel your Ink production.',
        pointerLabel: 'Capture Depots'
      },
      {
        stepIndex: 2,
        instruction: 'Recruit counter-units to overpower the enemy garrison, then destroy the Red HQ Base to graduate!',
        pointerLabel: 'Destroy Enemy HQ'
      }
    ]
  }
};
