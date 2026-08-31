import { Category, Story } from '../types/story';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'all', name: 'All Stories', slug: 'all', storyCount: 8 },
  { id: 'adventure', name: 'Adventure', slug: 'adventure', description: 'Thrilling journeys into the unknown', storyCount: 2 },
  { id: 'sci-fi', name: 'Sci-Fi', slug: 'sci-fi', description: 'Futuristic technologies and alien worlds', storyCount: 2 },
  { id: 'mystery', name: 'Mystery', slug: 'mystery', description: 'Enigmas, puzzles, and hidden truths', storyCount: 1 },
  { id: 'fantasy', name: 'Fantasy', slug: 'fantasy', description: 'Magic, mythical realms, and folklore', storyCount: 1 },
  { id: 'thriller', name: 'Thriller', slug: 'thriller', description: 'Suspenseful and gripping tales', storyCount: 1 },
  { id: 'inspirational', name: 'Inspirational', slug: 'inspirational', description: 'Heartwarming stories of courage and hope', storyCount: 1 },
];

export const INITIAL_STORIES: Story[] = [
  {
    id: 'story-1',
    title: 'The Lost Kingdom',
    slug: 'the-lost-kingdom',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    shortDescription: 'A young traveler discovers an ancient secret hidden inside a forgotten mountain village veiled by eternal mist.',
    category: 'adventure',
    categoryName: 'Adventure',
    tags: ['Ancient Relics', 'Expedition', 'Mountains', 'Discovery'],
    author: {
      id: 'author-1',
      name: 'Elena Vance',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      bio: 'Travel writer and folklorist with a penchant for high-altitude legends.'
    },
    uploadDate: '2026-08-31T09:00:00Z',
    updatedDate: '2026-08-31T09:00:00Z',
    readingTime: 5,
    views: 1420,
    featured: true,
    published: true,
    metaTitle: 'The Lost Kingdom - Short Story by Elena Vance',
    metaDescription: 'Read The Lost Kingdom, an immersive adventure short story about a traveler unveiling an ancient forgotten civilization in the mist-shrouded peaks.',
    fullContent: `The mist in the Voran Valley was not ordinary water vapor. It clung to the stone cliffs like spun silk, dense and smelling faintly of crushed juniper and cold brass.

Tarek wiped his goggles with a wool glove and checked the mechanical compass strapped to his forearm. The needle spun erratically, vibrating with an unsettling hum that reverberated up his wrist bone.

Three weeks had passed since he left the outpost at Highbridge. Every local had warned him that the northern ridgeline held only frostbite and phantom echoes of a collapsed empire. Yet in his knapsack, the copper tablet etched with sun-wheels burned with quiet promise.

As the late afternoon sun broke through the gray veil, the terrain suddenly yielded. Where the mountain ridge should have fallen away into an abyss, there stood a colossal archway carved directly into obsidian bedrock.

Beyond the arch, stone towers rose like silent sentinels, wrapped in flowering creepers that glowed with a faint luminescence. There were no sounds of machinery, no clinking of steel—only the whisper of wind moving through arched colonnades that had known neither footstep nor decay for a thousand seasons.

Tarek took a hesitant step across the threshold. The ground beneath his leather boots was smooth as polished river marble. In the center of the grand plaza rested a basin filled with clear, undisturbed spring water, reflecting a sky dotted with stars that did not match the charts of modern mapmakers.

He bent down and touched the water. A soft resonance hummed through the plaza tiles, and one by one, crystal lanterns atop the towering spires ignited in soft amber light. The kingdom was not gone; it had merely been waiting for someone who remembered how to look.`
  },
  {
    id: 'story-2',
    title: 'The Last Transmission from Kepler-452',
    slug: 'the-last-transmission-from-kepler-452',
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    shortDescription: 'Deep within the relay satellite station, operator Silas hears an impossible rhythmic frequency originating from a dead sector.',
    category: 'sci-fi',
    categoryName: 'Sci-Fi',
    tags: ['Deep Space', 'Signal', 'Kepler', 'Artificial Intelligence'],
    author: {
      id: 'author-2',
      name: 'Dr. Arthur Sterling',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      bio: 'Astrophysicist and science fiction author exploring cosmic isolation.'
    },
    uploadDate: '2026-08-30T14:15:00Z',
    updatedDate: '2026-08-30T14:15:00Z',
    readingTime: 6,
    views: 2180,
    featured: true,
    published: true,
    metaTitle: 'The Last Transmission from Kepler-452 - Sci-Fi Short Story',
    metaDescription: 'A gripping sci-fi tale of an isolated deep-space relay officer intercepting a mathematical transmission from an uninhabited planetary system.',
    fullContent: `The silence at Relay Station Outpost 14 was measured in decibels of coolant fluid circulating through quantum processors. Silas had spent four hundred days alone in orbit around the outer ring, monitoring static and solar flares.

His daily routine was predictable: recalibrate parabolic antennas at 06:00, log thermal drifts at noon, and filter out cosmic background noise before retiring to his magnetic bunk.

At 23:42 standard ship time, the primary audio console clicked. A high-frequency pulse peaked on the oscilloscope, drawing a sharp, harmonic curve across the amber monitor.

Silas dropped his synthetic coffee mug. It floated weightlessly for two seconds before the localized gravity field brought it softly to the mesh floor. He adjusted the receiver gain, dialing into band 1420.405 MHz—the hydrogen line.

What came through was not random cosmic radiation. It was a sequence of prime numbers followed by a complex polyphonic chord that resonated in perfect fifths.

"Computer, trace the origin," Silas commanded, his voice strained from lack of use.

The diagnostic screen flashed red, then switched to deep cobalt. "Signal origin: Kepler-452b. Transit time calculated at forty-two years. Message payload contains compressed linguistic matrices."

Silas hovered his hand over the uplink switch to Earth Command. If he relayed it, the colony ships would be diverted forever. If he opened the payload himself, he would be the first soul in human history to hear what lies beyond the silence.`
  },
  {
    id: 'story-3',
    title: 'The Clockmaker of Prague',
    slug: 'the-clockmaker-of-prague',
    coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    shortDescription: 'Every evening at twilight, Master Karel crafts a miniature pocket watch that can hold sixty seconds of frozen time.',
    category: 'mystery',
    categoryName: 'Mystery',
    tags: ['Time', 'Craftsmanship', 'Prague', 'Steampunk'],
    author: {
      id: 'author-3',
      name: 'Mirek Novak',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
      bio: 'Novelist fascinated by old European folklore and horology.'
    },
    uploadDate: '2026-08-29T18:30:00Z',
    updatedDate: '2026-08-29T18:30:00Z',
    readingTime: 4,
    views: 980,
    featured: false,
    published: true,
    metaTitle: 'The Clockmaker of Prague - Mystery Short Story',
    metaDescription: 'Step into cobblestone alleys of Prague where an aged watchmaker constructs timepieces capable of freezing singular fleeting moments.',
    fullContent: `In the narrow cobblestone alley behind the Church of Our Lady before Týn, Master Karel’s workshop smelled of linseed oil, brass filings, and aged parchment.

For forty years, townsfolk knew him as the eccentric watchmaker who refused to repair modern quartz movements. "A spring is a heartbeat," he would say, adjusting his brass loupe. "Electricity has no memory."

What none of his patrons realized was why certain watches on his top shelf bore no price tags. Each of those silver-cased chronometers was forged with a hairline escapement made of meteoric iron.

When wound three times counterclockwise and clicked shut, the watch captured the exact sixty seconds occurring around its bearer, isolating them in a suspended droplet of reality while the rest of the world stood motionless.

On a rainy Tuesday, a young woman with tear-streaked cheeks entered the bell-chimed doorway. In her arms she held a faded photograph of an elderly woman laughing under apple blossoms.

"They told me you can save things," she whispered, her voice trembling against the ticking backdrop of fifty clocks.

Master Karel looked at the photograph, then reached for his drawer of polished ruby gears. "Time cannot be reversed, child," he said softly. "But we can grant you one quiet minute to say the words you never finished."`
  },
  {
    id: 'story-4',
    title: 'The Whisper of the Rowan Tree',
    slug: 'the-whisper-of-the-rowan-tree',
    coverImage: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1200&q=80',
    shortDescription: 'In the heart of the Scottish Highlands, a botanical researcher uncovers a botanical root system that shares memories across centuries.',
    category: 'fantasy',
    categoryName: 'Fantasy',
    tags: ['Highlands', 'Folklore', 'Nature', 'Magic'],
    author: {
      id: 'author-4',
      name: 'Fiona MacLeod',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
      bio: 'Scottish author blending highland myths with ecological speculative fiction.'
    },
    uploadDate: '2026-08-28T11:00:00Z',
    updatedDate: '2026-08-28T11:00:00Z',
    readingTime: 5,
    views: 1120,
    featured: false,
    published: true,
    metaTitle: 'The Whisper of the Rowan Tree - Fantasy Short Story',
    metaDescription: 'Discover the ancient bond between humankind and the enchanted flora of the Scottish Highlands.',
    fullContent: `Isla knelt in the peat moss, her stainless steel trowel brushing against a root system that shimmered with an unnatural iridescent silver hue.

High on the slopes of Glen Lyon, the old rowan tree stood bent against centuries of Atlantic gales. Local tradition held that planting a rowan by the doorstep protected the household from enchantments and sorrow.

Isla placed her botanical acoustic sensor against the bark. She expected the slow, sluggish fluid cavitation typical of late-autumn sap. Instead, the headphones filled with the distinct rhythm of spoken Gaelic poetry.

She caught her breath, pulling off the headset and listening with her own ears. The wind hummed through the scarlet berries, producing subtle pitch variations that mimicked the cadence of human speech.

Closing her eyes, she placed her bare palm against the knotty trunk. A surge of warmth radiated through her fingertips—a rush of images: a 17th-century shepherd taking shelter under saplings during a blizzard; a young girl weaving rowan sprigs into bridal ribbons; an old soldier returning from forgotten wars to weep beneath the shade.

The tree was not merely a living organism; it was the living archive of every breath that had ever sought comfort beneath its boughs.`
  },
  {
    id: 'story-5',
    title: 'Echoes of the Neon Citadel',
    slug: 'echoes-of-the-neon-citadel',
    coverImage: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
    shortDescription: 'In a rain-drenched megacity running on synthetic memories, a memory salvage diver finds an untampered recollection of blue skies.',
    category: 'sci-fi',
    categoryName: 'Sci-Fi',
    tags: ['Cyberpunk', 'Memories', 'Dystopia', 'Neon'],
    author: {
      id: 'author-2',
      name: 'Dr. Arthur Sterling',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      bio: 'Astrophysicist and science fiction author exploring cosmic isolation.'
    },
    uploadDate: '2026-08-27T08:45:00Z',
    updatedDate: '2026-08-27T08:45:00Z',
    readingTime: 6,
    views: 1890,
    featured: false,
    published: true,
    metaTitle: 'Echoes of the Neon Citadel - Cyberpunk Sci-Fi Story',
    metaDescription: 'A moody, atmospheric cyberpunk narrative about synthetic memory traders in a sky-less future metropolis.',
    fullContent: `Sector 9 never saw the dawn. The towering sky-bridges and holographic billboard arrays projected an eternal, flickering dusk saturated with electric magenta and toxic cyan.

Ren adjusted the collar of his oilskin jacket as acid rain pooled on the chrome grated walkways. In the under-levels of New Kowloon, memory disks were the only currency that held value against hyperinflation.

Most salvaged disks contained manufactured nostalgia: thirty-second loops of warm seaside vacations or synthetic dinners with family members who had never existed.

In the backroom of a noodle shop on Alley 4, an informant slid a unibody titanium cartridge across the damp counter. "Unencrypted neural capture from pre-smog era," the man rasped. "Clean signature."

Ren jacked the fiber-optic lead directly into his cervical port. The bustling noise of the alley instantly dissolved.

Suddenly, he felt a breeze that did not carry the metallic tang of chemical scrubbers. Above him opened a vast, uninterrupted dome of cerulean blue, unobstructed by floating drone lanes or orbital towers. Sunlight—raw, unfiltered, and golden—warmed his skin with a heat so pure it brought an involuntary gasp to his throat.

For the first time in thirty-two years of living beneath the smog veil, Ren understood why humanity had once fought so fiercely for the world before the steel.`
  },
  {
    id: 'story-6',
    title: 'The Silent Passenger',
    slug: 'the-silent-passenger',
    coverImage: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1200&q=80',
    shortDescription: 'The night train from Vienna to Budapest always carries one passenger who never appears on the conductor’s manifest.',
    category: 'thriller',
    categoryName: 'Thriller',
    tags: ['Night Train', 'Suspense', 'Espionage', 'Europe'],
    author: {
      id: 'author-1',
      name: 'Elena Vance',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      bio: 'Travel writer and folklorist with a penchant for high-altitude legends.'
    },
    uploadDate: '2026-08-26T21:10:00Z',
    updatedDate: '2026-08-26T21:10:00Z',
    readingTime: 4,
    views: 1650,
    featured: false,
    published: true,
    metaTitle: 'The Silent Passenger - Suspense Thriller Short Story',
    metaDescription: 'A classic European night train suspense story of identity, clandestine secrets, and a passenger with no ticket and no name.',
    fullContent: `The rhythmic clatter of iron wheels over track joints was hypnotic in Compartment 7. Rain lashed sideways against the double-glazed window as the EuroNight express sliced through the Hungarian lowlands at two in the morning.

Janos checked his pocket watch for the third time. The train was due at Győr in twenty minutes, where he was supposed to make the drop: a microfiche hidden inside the spine of a vintage leather-bound guide to the Danube.

When the compartment door slid open without a click, Janos instinctively tucked his hand inside his coat.

A man in a charcoal wool trench coat stepped in, brushing droplets from his lapel. He carried no luggage, no ticket envelope, and his gaze fixed on the empty seat directly across from Janos.

"The border police boarded at Hegyeshalom," the stranger said in flawless, unaccented German. "They are checking manifests compartment by compartment."

Janos maintained a calm exterior. "I have a valid ticket and passport, sir."

The stranger offered a faint, melancholy smile. "They are not looking for tickets, Janos. They are looking for the guide to the Danube. And the conductor who stamped your ticket at Westbahnhof was replaced three stations ago."`
  },
  {
    id: 'story-7',
    title: 'The Lighthouse Keeper’s Daughter',
    slug: 'the-lighthouse-keepers-daughter',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    shortDescription: 'When the storm of the century knocks out the electric turbine, Maeve must climb the 180 iron stairs to keep the oil beacon alive.',
    category: 'inspirational',
    categoryName: 'Inspirational',
    tags: ['Courage', 'Storm', 'Lighthouse', 'Heritage'],
    author: {
      id: 'author-4',
      name: 'Fiona MacLeod',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
      bio: 'Scottish author blending highland myths with ecological speculative fiction.'
    },
    uploadDate: '2026-08-25T16:00:00Z',
    updatedDate: '2026-08-25T16:00:00Z',
    readingTime: 5,
    views: 890,
    featured: false,
    published: true,
    metaTitle: 'The Lighthouse Keeper’s Daughter - Inspirational Story',
    metaDescription: 'A tale of resilience and courage against insurmountable tempest waves off the rocky coast.',
    fullContent: `The swell against Cape Wrath roared like a wounded titan. Gale-force winds tore spray from the crests of fifty-foot waves, hurling seawater against the granite foundation of the tower.

Inside the keeper’s quarters, the circuit breakers gave a resounding pop, plunging the room into pitch blackness. Above them, the heavy hum of the electric beam died.

Out in the black storm, three cargo vessels were navigating the treacherous jagged reefs of the Minch, relying entirely on the Cape Wrath signature flash: two white, one red, every ten seconds.

"The backup generator flooded," her father groaned from his cot, his leg immobilized in a cast from yesterday's fall on the slippery jetty.

Maeve did not hesitate. She strapped on her oilskin coat, grabbed two heavy brass cans of kerosene, and struck a safety match to light the brass storm lantern.

"I know the rhythm, Dad," she said firmly.

Step by iron step, her thighs burning and the spiral stairway shuddering under the impact of the waves outside, Maeve climbed. When she reached the lantern gallery, wind roared through cracked vents. Working with frozen fingers, she primed the manual pressure wick and gave the flywheel its initial rotation.

A piercing beam of warm amber light cut through the black squall, reaching twenty miles out to sea. In the distance, a horn answered through the fog—the sound of three ships steering clear of the rocks.`
  },
  {
    id: 'story-8',
    title: 'The Navigator of the Dune Seas',
    slug: 'the-navigator-of-the-dune-seas',
    coverImage: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
    shortDescription: 'Sailing across shifting sand dunes on wind-skiffs, an old caravan master guides a crew toward the rumored Oasis of Glass.',
    category: 'adventure',
    categoryName: 'Adventure',
    tags: ['Desert', 'Expedition', 'Wind Skiff', 'Survival'],
    author: {
      id: 'author-3',
      name: 'Mirek Novak',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
      bio: 'Novelist fascinated by old European folklore and horology.'
    },
    uploadDate: '2026-08-24T10:00:00Z',
    updatedDate: '2026-08-24T10:00:00Z',
    readingTime: 5,
    views: 1340,
    featured: false,
    published: true,
    metaTitle: 'The Navigator of the Dune Seas - Adventure Short Story',
    metaDescription: 'Glide across golden sand oceans in wind-powered skiffs searching for a legendary mineral sanctuary.',
    fullContent: `The sand did not behave like soil in the Great Erg; it flowed like liquid copper beneath the wooden hulls of the wind-skiffs.

Captain Nadim pulled the hemp tiller tight as a gust from the Sirocco filled the lateen sail. The outrigger lifted three feet above the crest of a ridge, sending a spray of fine golden powder glittering into the sunlight.

Behind his skiff, four cargo sledges glided smoothly, tethered by braided camel-hair cables. Their destination was the fabled Oasis of Glass, where ancient lightning storms were said to have fused an entire lake bed into emerald crystal.

"Look to the southern horizon, Captain!" called young Tariq from the bow watch.

A dust devil was forming, spinning like a top between two reddish sand dunes. Nadim squinted through his brass sextant, reading the alignment of the midday sun against the mountain peaks fifty leagues to the north.

"Hold the course," Nadim commanded calmly. "The wind that creates the vortex will carry us over the ridge."

With a sudden surge of momentum, the skiff crested the tallest dune. Below them, stretching as far as the eye could see, lay an expanse of translucent green glass reflecting the azure desert sky, with fresh freshwater bubbling up from deep mineral fissures in the center. They had arrived.`
  }
];
