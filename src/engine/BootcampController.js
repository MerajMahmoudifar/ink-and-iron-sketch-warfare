// ==========================================================================
// OFFICER BOOTCAMP CONTROLLER — TACTICAL TRAINING SYSTEM
// Complete 8-Lesson Curriculum Metadata with Structured Objectives & Ghost Routes
// ==========================================================================

export const BOOTCAMP_LESSONS = {
  1: {
    id: 1,
    title: 'The WEGO Clock',
    subtitle: 'Movement & Simultaneous Execution',
    duration: '60s',
    doctrine: 'Orders execute simultaneously! Queue movement waypoints during Planning, then hit End Phase.',
    description: 'Learn how to select your squad, plot adjacent movement waypoints, and hit End Phase to watch simultaneous execution.',
    steps: [
      {
        stepIndex: 1,
        label: 'Select Rifle Squad',
        instruction: 'Click your Rifle Squad at the deployment point (highlighted in gold).',
        requiredAction: 'SELECT_UNIT',
        targetPos: { x: 1, y: 3 },
        pointerPos: { x: 1, y: 3 },
        pointerLabel: '1. Click Squad'
      },
      {
        stepIndex: 2,
        label: 'Plot Path to Flag',
        instruction: 'Click adjacent tiles to draw a movement path towards the Green Flag extraction point at D4 [3, 3].',
        requiredAction: 'QUEUE_WAYPOINTS',
        targetPos: { x: 3, y: 3 },
        pointerPos: { x: 3, y: 3 },
        ghostPath: [{ x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }],
        pointerLabel: '2. Plot Path to Flag'
      },
      {
        stepIndex: 3,
        label: 'Execute Simultaneous Turn',
        instruction: 'Orders locked! Click "End Phase" on the top right to execute simultaneous movement.',
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
    doctrine: 'Infantry in forests automatically enter Ambush Stance (+50% defense, surprise critical attack).',
    description: 'Conceal a squad in dense forest with Ambush Stance to spring a surprise attack with 50% reduced return fire.',
    steps: [
      {
        stepIndex: 1,
        label: 'Inspect Hidden Squad',
        instruction: 'Click your Rifle Squad concealed inside the Forest corridor at C4 [2, 3].',
        requiredAction: 'SELECT_UNIT',
        targetPos: { x: 2, y: 3 },
        pointerPos: { x: 2, y: 3 },
        pointerLabel: '1. Select Forest Squad'
      },
      {
        stepIndex: 2,
        label: 'Spring the Ambush Trap',
        instruction: 'Verify AMBUSH stance in the Inspector. Click "End Phase" to hold ground and ambush the approaching patrol!',
        requiredAction: 'END_PHASE',
        targetElementId: 'btn-end-turn',
        pointerLabel: '2. Spring Ambush'
      }
    ]
  },
  3: {
    id: 3,
    title: 'Supply Depots & Recruiting',
    subtitle: 'War Economy & Reinforcements',
    duration: '90s',
    doctrine: 'Depots grant +10 Ink/Turn and serve as forward spawn points, but THE TILE MUST BE EMPTY to deploy.',
    description: 'Capture a neutral Gold Supply Depot to gain +10 Ink/Turn, master the empty-tile forward deployment rule, and reinforce your army.',
    steps: [
      {
        stepIndex: 1,
        label: 'Order Scout to Depot',
        instruction: 'Select your fast Scout and click the neutral Gold Supply Depot at E4 [4, 3] to plot a route.',
        requiredAction: 'QUEUE_WAYPOINTS',
        targetPos: { x: 4, y: 3 },
        pointerPos: { x: 4, y: 3 },
        ghostPath: [{ x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }],
        pointerLabel: '1. Move to Gold Depot'
      },
      {
        stepIndex: 2,
        label: 'Secure Depot (+10 Ink)',
        instruction: 'Orders locked! Click "End Phase" to advance your Scout and secure the Depot.',
        requiredAction: 'END_PHASE',
        targetElementId: 'btn-end-turn',
        pointerLabel: '2. Capture Depot'
      },
      {
        stepIndex: 3,
        label: 'Recruit Squad at Base Ring',
        instruction: 'Depot secured! Since your Scout occupies the Depot, open the Recruit Store and deploy a Rifle Squad at your empty Base ring at B4 [1, 3].',
        requiredAction: 'RECRUIT_UNIT',
        targetElementId: 'store-card-RIFLEMAN',
        pointerLabel: '3. Recruit Squad at Base'
      }
    ]
  },
  4: {
    id: 4,
    title: 'The Counter Triangle',
    subtitle: 'Rock-Paper-Scissors Combat Matrix',
    duration: '90s',
    doctrine: 'Anti-Tank pierces Armor (2.5x) • Infantry flanks AT Crews • Vehicles crush Infantry (1.5x).',
    description: 'Master rock-paper-scissors: Anti-Tank pierces heavy armor, Rifle Squad flanks AT crews, and Armored Cars crush infantry.',
    steps: [
      {
        stepIndex: 1,
        label: 'Top Lane: AT vs Armored Car',
        instruction: 'Select Anti-Tank crew at B2 [1, 1] and advance to target the Enemy Armored Car at E2 [4, 1] (2.5x Armor Penetration!).',
        requiredAction: 'ATTACK_LANE_1',
        targetPos: { x: 4, y: 1 },
        pointerPos: { x: 1, y: 1 },
        ghostPath: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }],
        pointerLabel: '1. AT vs Armored Car'
      },
      {
        stepIndex: 2,
        label: 'Mid Lane: Rifle vs AT Crew',
        instruction: 'Select Rifle Squad at B4 [1, 3] and advance to flank the Enemy AT Crew at E4 [4, 3] (Infantry flanks AT!).',
        requiredAction: 'ATTACK_LANE_2',
        targetPos: { x: 4, y: 3 },
        pointerPos: { x: 1, y: 3 },
        ghostPath: [{ x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }],
        pointerLabel: '2. Rifle vs AT Crew'
      },
      {
        stepIndex: 3,
        label: 'Bottom Lane: Car vs Infantry',
        instruction: 'Select Armored Car at B6 [1, 5] and advance to crush the Enemy Rifle Squad at E6 [4, 5] (1.5x Crush!).',
        requiredAction: 'ATTACK_LANE_3',
        targetPos: { x: 4, y: 5 },
        pointerPos: { x: 1, y: 5 },
        ghostPath: [{ x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }],
        pointerLabel: '3. Car vs Infantry'
      },
      {
        stepIndex: 4,
        label: 'Execute Triangle Counters',
        instruction: 'All counter-orders locked! Click "End Phase" to watch all 3 lanes win their decisive counter-engagements.',
        requiredAction: 'END_PHASE',
        targetElementId: 'btn-end-turn',
        pointerLabel: '4. Execute Counters'
      }
    ]
  },
  5: {
    id: 5,
    title: 'Bog Shortcut & Chokepoint Race',
    subtitle: 'Terrain Intelligence & Vehicle Hazard',
    duration: '90s',
    doctrine: 'Vehicles CANNOT cross deep mud! Infantry wades through in 1 turn to seize mountain passes first.',
    description: 'Symmetrical chokepoint race! Hostiles deployed an Armored Car. Use the mud shortcut to arrive earlier at the mountain pass and camp in the forest.',
    steps: [
      {
        stepIndex: 1,
        label: 'Wade into Mud Shortcut',
        instruction: 'Vehicles cannot enter deep mud and must detour south. Order your AT Crew from B4 [1, 3] into the Mud shortcut at C4 [2, 3] and click End Phase!',
        requiredAction: 'MUD_SHORTCUT',
        targetPos: { x: 2, y: 3 },
        pointerPos: { x: 2, y: 3 },
        pointerLabel: '1. Wade into Mud'
      },
      {
        stepIndex: 2,
        label: 'Seize Forest Pass',
        instruction: 'Mire cleared! The enemy vehicle was forced into a massive southern detour. Move your AT Crew into the Forest Pass at D4 [3, 3] and click End Phase.',
        requiredAction: 'SEIZE_PASS',
        targetPos: { x: 3, y: 3 },
        pointerPos: { x: 3, y: 3 },
        pointerLabel: '2. Seize Forest Pass'
      },
      {
        stepIndex: 3,
        label: 'Camp in Ambush Stance',
        instruction: 'Hostile Armored Car is approaching! Your squad has 25 HP — camping in the Forest pass for Ambush Strike is your only survival key. Click End Phase!',
        requiredAction: 'END_PHASE',
        targetElementId: 'btn-end-turn',
        pointerLabel: '3. Spring Ambush'
      }
    ]
  },
  6: {
    id: 6,
    title: 'Command Abilities',
    subtitle: 'Recon Flares & Heavy Barrages',
    duration: '90s',
    doctrine: 'You cannot call Artillery blindly into Fog of War! Launch a Recon Flare first to reveal coordinates.',
    description: 'Launch a Recon Flare to pierce the Fog of War, then call down a high-explosive Artillery Strike to obliterate the enemy position.',
    steps: [
      {
        stepIndex: 1,
        label: 'Launch Recon Flare (2 CP)',
        instruction: 'Hostiles are hidden by Fog of War behind the ridge. Click "Recon Flare" (2 CP) in the Command panel and launch it at G4 [6, 3]!',
        requiredAction: 'USE_FLARE',
        targetElementId: 'btn-ability-flare',
        targetPos: { x: 6, y: 3 },
        pointerLabel: '1. Click Recon Flare'
      },
      {
        stepIndex: 2,
        label: 'Call Artillery Strike (4 CP)',
        instruction: 'Target revealed at G4 [6, 3]! Click "Artillery Strike" (4 CP) and target the revealed squad to order an off-map barrage.',
        requiredAction: 'USE_ARTILLERY',
        targetElementId: 'btn-ability-artillery',
        targetPos: { x: 6, y: 3 },
        pointerLabel: '2. Call Artillery'
      },
      {
        stepIndex: 3,
        label: 'Watch Barrage Impact',
        instruction: 'Coordinates confirmed! Click "End Phase" to watch the artillery strike obliterate the enemy nest.',
        requiredAction: 'END_PHASE',
        targetElementId: 'btn-end-turn',
        pointerLabel: '3. Execute Barrage'
      }
    ]
  },
  7: {
    id: 7,
    title: 'Base Defense & Siege',
    subtitle: 'Lifting Enemy Chokepoints',
    duration: '90s',
    doctrine: 'Hostiles adjacent to captured Depots place them Under Siege, blocking deployment until the raider is destroyed.',
    description: 'Enemy raiders have placed your forward Depot Under Siege, blocking deployment. Break the enemy line to lift the siege and spawn reinforcements!',
    steps: [
      {
        stepIndex: 1,
        label: 'Break the Raider Siege',
        instruction: 'Forward Depot at D4 [3, 3] is UNDER SIEGE by an adjacent enemy raider at E4 [4, 3]! Advance your AT Crew from B4 [1, 3] to C4 [2, 3] to destroy the raider.',
        requiredAction: 'BREAK_SIEGE',
        targetPos: { x: 2, y: 3 },
        pointerPos: { x: 2, y: 3 },
        pointerLabel: '1. Advance to Fire'
      },
      {
        stepIndex: 2,
        label: 'Deploy at Liberated Depot',
        instruction: 'Siege lifted! The forward Supply Depot is liberated and empty. Open the Store, recruit a Rifle Squad, and deploy directly onto the Depot at D4 [3, 3]!',
        requiredAction: 'FORWARD_DEPLOY',
        targetElementId: 'store-card-RIFLEMAN',
        targetPos: { x: 3, y: 3 },
        pointerLabel: '2. Deploy at Depot'
      }
    ]
  },
  8: {
    id: 8,
    title: 'Grand Graduation Skirmish',
    subtitle: 'Operation Diesel Storm',
    duration: '2 Min',
    doctrine: 'Capstone Examination: Combine capture, counters, cover, terrain hazards, and command abilities.',
    description: 'Operation Diesel Storm: Capture forward Depots, utilize mud corridors & forest cover, call in Command Abilities, and destroy the enemy HQ at [H8] to graduate!',
    steps: [
      {
        stepIndex: 1,
        label: 'Capture Forward Depots',
        instruction: 'Advance your units to secure the central Gold Supply Depots to fuel your Ink production.',
        requiredAction: 'CAPTURE_OBJECTIVES',
        pointerLabel: 'Secure Depots'
      },
      {
        stepIndex: 2,
        label: 'Demolish Enemy HQ',
        instruction: 'Recruit counter-units to break the enemy frontline, then assault and destroy the Red HQ Base at H8 [7, 7] to graduate!',
        requiredAction: 'DESTROY_HQ',
        pointerLabel: 'Destroy Enemy HQ'
      }
    ]
  }
};
