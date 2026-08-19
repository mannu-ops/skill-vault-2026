import type { CourseModule, CourseProject } from '@/data/courses';
import type { ThemeColor } from './theme-config';

export interface CategoryDetails {
  badge: string;
  themeColor: ThemeColor;
  iconName: string;
  duration: string;
  modulesCount: number;
  skills: string[];
  modules: CourseModule[];
  projects: CourseProject[];
}

export function getCategoryDetails(category: string, id: string): CategoryDetails {
  const cat = category.toLowerCase();
  const cId = id.toLowerCase();

  if (cat.includes('full stack') || cId.includes('mern')) {
    return {
      badge: 'Best Seller',
      themeColor: 'violet',
      iconName: 'Terminal',
      duration: '12 Modules • 48 Hours',
      modulesCount: 12,
      skills: ['JavaScript', 'React.js', 'Node.js', 'Express.js', 'MongoDB', 'REST APIs', 'Git', 'Deployment'],
      modules: [
        { number: '01', title: 'Web Development Fundamentals', detail: 'Understand browsers, servers, command line, and web architecture.', lessons: '4 Lessons' },
        { number: '02', title: 'HTML5 & Responsive CSS', detail: 'Build modern grid layouts, flexbox, and responsive UI components.', lessons: '5 Lessons' },
        { number: '03', title: 'Modern JavaScript (ES6+)', detail: 'Master async/await, closures, DOM manipulation, and promises.', lessons: '6 Lessons' },
        { number: '04', title: 'React.js Core & Hooks', detail: 'Build dynamic interfaces, custom hooks, and manage app state.', lessons: '7 Lessons' },
        { number: '05', title: 'Node.js & Server Fundamentals', detail: 'Build event-driven backend scripts and filesystem operations.', lessons: '4 Lessons' },
        { number: '06', title: 'Express.js Framework & Middleware', detail: 'Design modular REST APIs, route parameters, and error handling.', lessons: '5 Lessons' },
        { number: '07', title: 'MongoDB & Database Storage', detail: 'Schema design, indexes, aggregations, and persistent storage.', lessons: '6 Lessons' },
        { number: '08', title: 'Full Stack MERN Capstone Project', detail: 'Combine frontend and backend into a production SaaS application.', lessons: '8 Lessons' },
      ],
      projects: [
        { title: 'Interactive React Dashboard', description: 'Dynamic analytics dashboard with charts.', tags: ['React', 'Tailwind'] },
        { title: 'RESTful E-Commerce API', description: 'Backend API with auth and cart routes.', tags: ['Node.js', 'MongoDB'] },
        { title: 'Full Stack SaaS Web Application', description: 'Production MERN app with user auth.', tags: ['MERN', 'REST API'] }
      ]
    };
  } else if (cat.includes('devops') || cat.includes('cloud') || cId.includes('devops')) {
    return {
      badge: 'High Demand',
      themeColor: 'cyan',
      iconName: 'Server',
      duration: '10 Modules • 42 Hours',
      modulesCount: 10,
      skills: ['Docker', 'Kubernetes', 'AWS', 'GitHub Actions', 'Terraform', 'Nginx', 'Prometheus', 'Grafana'],
      modules: [
        { number: '01', title: 'Linux Administration & Shell Automation', detail: 'Process management and bash scripts.', lessons: '5 Lessons' },
        { number: '02', title: 'Docker Containers & Multi-Stage Builds', detail: 'Dockerfile optimization and Docker Compose.', lessons: '6 Lessons' },
        { number: '03', title: 'Kubernetes Orchestration & Clusters', detail: 'Deployments, services, and ingress controllers.', lessons: '7 Lessons' },
        { number: '04', title: 'CI/CD Pipelines with GitHub Actions', detail: 'Automated test, build, and deploy workflows.', lessons: '5 Lessons' },
        { number: '05', title: 'Infrastructure as Code with Terraform', detail: 'Declarative cloud provisioning.', lessons: '6 Lessons' }
      ],
      projects: [
        { title: 'Dockerized Microservices Environment', description: 'Multi-container orchestration setup.', tags: ['Docker', 'Redis'] },
        { title: 'Production K8s Deployment Pipeline', description: 'Automated CI/CD cluster deployment.', tags: ['Kubernetes', 'AWS'] }
      ]
    };
  } else if (cat.includes('ai') || cat.includes('data') || cId.includes('ai')) {
    return {
      badge: 'Trending',
      themeColor: 'emerald',
      iconName: 'Sparkles',
      duration: '14 Modules • 56 Hours',
      modulesCount: 14,
      skills: ['Python', 'PyTorch', 'Pandas & NumPy', 'Scikit-Learn', 'LLMs & Prompting', 'LangChain', 'Vector DBs', 'RAG'],
      modules: [
        { number: '01', title: 'Python for Data Science & AI', detail: 'NumPy vector operations and Pandas DataFrames.', lessons: '6 Lessons' },
        { number: '02', title: 'Neural Networks with PyTorch', detail: 'Tensors, backpropagation, and training loops.', lessons: '7 Lessons' },
        { number: '03', title: 'LLMs & Retrieval-Augmented Generation', detail: 'Vector databases, Pinecone, and RAG pipelines.', lessons: '6 Lessons' }
      ],
      projects: [
        { title: 'Predictive ML Analytics Model', description: 'Customer churn prediction model.', tags: ['Python', 'Scikit-Learn'] },
        { title: 'Enterprise RAG Knowledge Assistant', description: 'AI assistant querying private PDFs.', tags: ['LangChain', 'LLMs'] }
      ]
    };
  } else if (cat.includes('mobile') || cId.includes('mobile')) {
    return {
      badge: 'Popular',
      themeColor: 'amber',
      iconName: 'Layers3',
      duration: '10 Modules • 36 Hours',
      modulesCount: 10,
      skills: ['React Native', 'Expo', 'TypeScript', 'Expo Router', 'NativeWind', 'AsyncStorage', 'Push Notifications'],
      modules: [
        { number: '01', title: 'React Native & Expo Workflow', detail: 'Development builds and mobile UI layout.', lessons: '4 Lessons' },
        { number: '02', title: 'Mobile Navigation & Deep Links', detail: 'Stack, tab bars, and Expo Router.', lessons: '5 Lessons' },
        { number: '03', title: 'Device APIs & Storage', detail: 'Camera, GPS, and local persistence.', lessons: '6 Lessons' }
      ],
      projects: [
        { title: 'Cross-Platform Fitness App', description: 'Workout tracker with charts.', tags: ['React Native', 'Expo'] }
      ]
    };
  } else if (cat.includes('system') || cId.includes('system')) {
    return {
      badge: 'Advanced',
      themeColor: 'indigo',
      iconName: 'GitBranch',
      duration: '9 Modules • 32 Hours',
      modulesCount: 9,
      skills: ['Microservices', 'System Design', 'Redis Caching', 'Kafka', 'DB Sharding', 'CDN', 'Rate Limiting'],
      modules: [
        { number: '01', title: 'System Design Foundations & CAP Theorem', detail: 'Latency, throughput, and availability.', lessons: '4 Lessons' },
        { number: '02', title: 'Load Balancing & Caching with Redis', detail: 'Cache invalidation and reverse proxies.', lessons: '5 Lessons' },
        { number: '03', title: 'Database Sharding & Microservices', detail: 'Partitioning keys and message queues.', lessons: '6 Lessons' }
      ],
      projects: [
        { title: 'High-Throughput Rate Limiter', description: 'Redis-backed rate limiter for 50k req/sec.', tags: ['Redis', 'System Design'] }
      ]
    };
  }

  return {
    badge: 'Essential',
    themeColor: 'rose',
    iconName: 'ShieldCheck',
    duration: '10 Modules • 38 Hours',
    modulesCount: 10,
    skills: ['Ethical Hacking', 'OWASP Top 10', 'Wireshark', 'Burp Suite', 'Nmap', 'Penetration Testing'],
    modules: [
      { number: '01', title: 'Network Reconnaissance with Nmap', detail: 'Port scanning and packet analysis.', lessons: '5 Lessons' },
      { number: '02', title: 'OWASP Top 10 Exploitation', detail: 'SQL Injection and XSS mitigation.', lessons: '5 Lessons' },
      { number: '03', title: 'API Security & Burp Suite', detail: 'Session hijacking and security audits.', lessons: '6 Lessons' }
    ],
    projects: [
      { title: 'Web Vulnerability Assessment', description: 'Security audit against OWASP top 10.', tags: ['Burp Suite', 'OWASP'] }
    ]
  };
}
