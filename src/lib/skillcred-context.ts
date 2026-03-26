/**
 * SkillCred Platform Context Library
 * This module contains all the structured knowledge about SkillCred's 8 streams,
 * core features, and content templates that the AI engines use as context.
 * 
 * Brand Motto: "Learn. Build. Verify. Get Hired."
 * Brand Slogan: "Stop Watching. Start Building."
 */

export const SKILLCRED_STREAMS = [
  {
    id: "fullstack",
    name: "Fullstack development",
    description: "Stop Watching. Start Building end-to-end web applications. Master concepts, build 15+ real-world projects, get mentor verified, and get hired.",
    topics: [
      "Building a Headless E-Learning CMS with GraphQL & HLS Video",
      "Modern React & Next.js architectures",
      "Database design and scalable APIs",
      "Mentor-verified code reviews for UI/UX",
      "Passing the Project Assessment Test (PAT) as a Fullstack Dev"
    ],
    hashtags: "#FullStack #WebDevelopment #ReactJS #NodeJS #SoftwareEngineering"
  },
  {
    id: "data-engineering",
    name: "Data Engineering",
    description: "Learn to build robust data pipelines. Build real-world projects, get your code verified by industry experts, and unlock the Career Hub.",
    topics: [
      "Building an Automated Data Governance & Lineage SaaS",
      "Scanning Snowflake/BigQuery schemas & parsing SQL logs",
      "PII detection and automated masking policies",
      "Real-time data processing with Kafka & Spark",
      "Data pipeline deployment and orchestration"
    ],
    hashtags: "#DataEngineering #BigData #DataPipeline #ETL #DataArchitecture"
  },
  {
    id: "ai-ml",
    name: "AI & ML",
    description: "Learn. Build. Verify. Get Hired. Dive deep into machine learning models and transformers to build intelligent applications.",
    topics: [
      "Building a Multi-Modal Personal Shopper AI",
      "Visual search and integrating vision & NLP transformers",
      "Fine-tuning Large Language Models (LLMs)",
      "Building RAG (Retrieval-Augmented Generation) systems",
      "Deploying AI models to production for recruiter visibility"
    ],
    hashtags: "#AI #MachineLearning #DeepLearning #LLM #ArtificialIntelligence"
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    description: "Stop watching hacking tutorials. Start building secure systems. Construct DevSecOps pipelines and get verified by security mentors.",
    topics: [
      "Building a DevSecOps Pipeline Enforcer",
      "Intercepting CI/CD jobs for SAST (Semgrep) & DAST (ZAP)",
      "Automated secrets scanning with TruffleHog",
      "Container signing before Kubernetes deployment",
      "Zero Trust architecture principles"
    ],
    hashtags: "#Cybersecurity #InfoSec #EthicalHacking #Security #DataProtection"
  },
  {
    id: "iot",
    name: "IoT & Embedded Systems",
    description: "Connect the physical world to the digital. Build real hardware projects, get your firmware mentor-verified, and land IoT roles.",
    topics: [
      "Building an Automated Hydroponics Controller",
      "Managing pH dosing pumps & nutrient mixers via EC sensors",
      "Programming microcontrollers (Arduino, ESP32)",
      "IoT communication protocols (MQTT, CoAP)",
      "Edge computing and hardware optimization"
    ],
    hashtags: "#IoT #EmbeddedSystems #Hardware #EdgeComputing #SmartDevices"
  },
  {
    id: "data-science",
    name: "Data Science & Analytics",
    description: "Extract actionable insights from raw data. Build 15+ data projects, pass the PAT, and connect with top recruiters.",
    topics: [
      "Building a Climate Risk & ESG Scoring Engine",
      "NLP processing of 10-K reports & geospatial climate data",
      "Statistical modeling and predictive analytics",
      "Creating interactive data dashboards",
      "Mentor-verified data wrangling techniques"
    ],
    hashtags: "#DataScience #DataAnalytics #DataVisualization #Python #Analytics"
  },
  {
    id: "mobile-dev",
    name: "Mobile Development",
    description: "Stop Watching. Start Building native and cross-platform mobile apps. From learning to getting hired via the SkillCred Career Hub.",
    topics: [
      "Building an Audio-First Social/Podcast App (Clubhouse clone)",
      "Live drop-in audio rooms using Agora/LiveKit",
      "Audio streaming and background playback controls",
      "Cross-platform development with React Native/Flutter",
      "App Store deployment and performance optimization"
    ],
    hashtags: "#MobileDevelopment #AppDev #ReactNative #Flutter #MobileApp"
  },
  {
    id: "devops-cloud",
    name: "DevOps & Cloud",
    description: "Learn cloud infrastructure by doing. Build CI/CD pipelines, get your infrastructure code verified, and prove your competency.",
    topics: [
      "Building an Edge Computing Fleet Orchestrator",
      "Managing offline-sync & canary rollouts to Raspberry Pis",
      "Remote telemetry collection and infrastructure as code",
      "Containerization mastery (Docker & Kubernetes)",
      "Automating CI/CD pipelines for production"
    ],
    hashtags: "#DevOps #CloudComputing #AWS #Kubernetes #CICD"
  }
];

export const PLATFORM_GUIDELINES = {
  LinkedIn: {
    style: "Professional, insightful, story-driven. Always emphasize the SkillCred journey: 'Learn. Build. Verify. Get Hired.' Use line breaks for readability. End with a strong CTA to start building.",
    format: "Text with optional image. Use emojis sparingly."
  },
  Instagram: {
    style: "Visual-first, casual but intense focus on building real projects. 'Stop Watching. Start Building.' Use relevant emojis and hashtags.",
    format: "Caption for image/carousel post. Include 20-30 hashtags at the end."
  },
  "YouTube Community Post": {
    style: "Conversational, poll-friendly, engagement-driven. Ask opinions about specific tech stacks or capstone projects.",
    format: "Short text with optional poll or image."
  },
  "Twitter/X": {
    style: "Punchy, witty. Heavily emphasize the value of mentor-verified code and passing the PAT to unlock the Career Hub.",
    format: "Single tweet or thread starter."
  }
};

export const CONTENT_TYPES = [
  { id: "tip", label: "Quick Tip / Hack", icon: "💡" },
  { id: "tutorial", label: "Mini Tutorial", icon: "📚" },
  { id: "news", label: "Industry News", icon: "📰" },
  { id: "feature", label: "SkillCred Feature", icon: "🌟" },
  { id: "motivation", label: "Motivational / Career", icon: "🚀" },
  { id: "comparison", label: "Tool Comparison", icon: "⚖️" },
  { id: "project", label: "Project Walkthrough", icon: "🛠️" },
  { id: "poll", label: "Poll / Discussion", icon: "📊" }
];
