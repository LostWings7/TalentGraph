"""Seed Data Management Command for TalentGraph AI.

Generates a realistic synthetic enterprise organization comprising:
  - 40 Skills across 7 categories
  - 50 Learning Resources across top providers
  - 25 Technical Projects with concrete outcomes
  - 15 Diverse Enterprise Roles with explicit skill requirements
  - 30 Realistic Employees across Engineering, AI/ML, Data, Cloud, Product, and Security
  - Employee skills, project contributions, learning histories, and career goals
"""
import random
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.contrib.auth.models import User
from apps.core.models import Enterprise, UserProfile, ApprovalRequest, AuditLog
from apps.skills.models import Skill
from apps.roles.models import Role, RoleSkill
from apps.projects.models import Project, ProjectContribution, StaffingRequest, StaffingRecommendation
from apps.learning.models import LearningResource, EmployeeLearning
from apps.employees.models import Employee, EmployeeSkill, CareerGoal
from apps.mobility.matching_service import calculate_role_match
from apps.ai.embeddings import get_text_embedding
from apps.ai.profile_builder import build_employee_text_context, build_role_text_context

class Command(BaseCommand):
    help = "Seed database with NovaTech Solutions enterprise, HR admin, 30 employee accounts, 15 roles, 40 skills, 25 projects, and 50 learning courses"

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Purging existing records...")
        StaffingRecommendation.objects.all().delete()
        StaffingRequest.objects.all().delete()
        ApprovalRequest.objects.all().delete()
        AuditLog.objects.all().delete()
        UserProfile.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        EmployeeLearning.objects.all().delete()
        ProjectContribution.objects.all().delete()
        EmployeeSkill.objects.all().delete()
        CareerGoal.objects.all().delete()
        RoleSkill.objects.all().delete()
        LearningResource.objects.all().delete()
        Project.objects.all().delete()
        Role.objects.all().delete()
        Skill.objects.all().delete()
        Employee.objects.all().delete()
        Enterprise.objects.all().delete()

        self.stdout.write("0. Creating Primary Enterprise: NovaTech Solutions...")
        novatech = Enterprise.objects.create(
            name="NovaTech Solutions",
            legal_name="NovaTech Solutions Inc.",
            slug="novatech-solutions",
            industry="Enterprise AI & Cloud Software",
            description="Enterprise cloud platform specializing in scalable AI infrastructure, distributed systems, and workforce intelligence.",
            mission="Empowering global engineering and AI teams with continuous talent capability mapping and autonomous orchestration.",
            size="2,500 employees",
            departments=["Engineering", "AI Research", "Data Platform", "Cloud Architecture", "Product", "Security"],
            locations=["San Francisco, CA", "Seattle, WA", "New York, NY", "Remote"],
            work_modes=["Hybrid", "Remote", "On-site"],
            website="https://novatech.ai"
        )

        # Create HR Admin User
        hr_user = User.objects.create_user(
            username="hr_admin",
            email="hr@novatech.demo",
            password="password123",
            first_name="Sarah",
            last_name="Vance",
            is_staff=True
        )
        UserProfile.objects.create(
            user=hr_user,
            enterprise=novatech,
            role='hr_admin',
            title='Chief Talent Officer / HR Administrator',
            is_temporary_password=False
        )

        self.stdout.write("1. Creating 40 industry skills...")
        skills_data = [
            # AI & Machine Learning (8)
            ("Machine Learning", "AI/ML", "Foundational statistical modeling, supervised and unsupervised ML algorithms", "Critical"),
            ("Deep Learning", "AI/ML", "Neural network architectures, CNNs, Transformers, and gradient backprop", "Critical"),
            ("Natural Language Processing", "AI/ML", "Text processing, semantic parsing, LLM tokenization, and embeddings", "Critical"),
            ("Generative AI", "AI/ML", "Prompt engineering, LLM orchestration, structured outputs, and agents", "Critical"),
            ("Retrieval-Augmented Generation (RAG)", "AI/ML", "Vector retrieval, chunking, reranking, and knowledge grounding", "Critical"),
            ("PyTorch", "AI/ML", "Deep learning framework for training and fine-tuning tensor models", "Critical"),
            ("MLOps", "AI/ML", "Model serving, continuous evaluation, drift detection, and feature stores", "Critical"),
            ("Computer Vision", "AI/ML", "Image classification, object detection, segmentation, and multimodal vision", "Growing"),

            # Backend & Distributed Systems (7)
            ("Python", "Backend", "High-level programming language for backend services and data workflows", "Stable"),
            ("Django REST Framework", "Backend", "Scalable RESTful API development in Python", "Stable"),
            ("FastAPI", "Backend", "Asynchronous modern Python microservice framework", "Growing"),
            ("Go", "Backend", "High-concurrency systems programming language", "Growing"),
            ("Java", "Backend", "Enterprise grade backend development and Spring ecosystem", "Stable"),
            ("PostgreSQL", "Backend", "Relational database modeling, query tuning, and ACID compliance", "Stable"),
            ("Redis", "Backend", "In-memory key-value store for caching and pub/sub messaging", "Stable"),

            # Data Engineering & Analytics (6)
            ("Apache Kafka", "Data Engineering", "Distributed event streaming platform for real-time telemetry", "Critical"),
            ("Apache Spark", "Data Engineering", "Distributed cluster computing for large-scale batch and streaming ETL", "Growing"),
            ("Apache Airflow", "Data Engineering", "Orchestration and scheduling of complex data DAG pipelines", "Growing"),
            ("SQL", "Data Engineering", "Advanced data querying, window functions, and analytics transformation", "Stable"),
            ("dbt", "Data Engineering", "Data transformation tool for modern analytics warehouses", "Growing"),
            ("Snowflake", "Data Engineering", "Cloud enterprise data warehouse architecture and data sharing", "Growing"),

            # Cloud & Infrastructure (6)
            ("Amazon Web Services (AWS)", "Cloud & DevOps", "Cloud compute, IAM, ECS, S3, and serverless architectures", "Stable"),
            ("Google Cloud Platform (GCP)", "Cloud & DevOps", "Cloud services, BigQuery, Vertex AI, and Cloud Run", "Growing"),
            ("Kubernetes", "Cloud & DevOps", "Container orchestration, auto-scaling, and helm deployment management", "Critical"),
            ("Docker", "Cloud & DevOps", "Containerization and lightweight runtime packaging", "Stable"),
            ("Terraform", "Cloud & DevOps", "Declarative Infrastructure as Code (IaC) for multi-cloud environments", "Critical"),
            ("CI/CD Pipelines", "Cloud & DevOps", "Automated linting, testing, and zero-downtime deployment pipelines", "Stable"),

            # Frontend & Mobile (4)
            ("React", "Frontend", "Component-driven declarative frontend UI library", "Stable"),
            ("TypeScript", "Frontend", "Statically typed JavaScript for enterprise web applications", "Critical"),
            ("Next.js", "Frontend", "Server-side rendering, routing, and full-stack React framework", "Growing"),
            ("Tailwind CSS", "Frontend", "Utility-first CSS framework for design systems and fast styling", "Growing"),

            # Cybersecurity & Governance (4)
            ("Cybersecurity", "Security", "Threat modeling, vulnerability assessment, and defense in depth", "Critical"),
            ("DevSecOps", "Security", "Shift-left security integration into CI/CD pipelines and static analysis", "Critical"),
            ("Application Security", "Security", "OWASP Top 10 mitigation, auth protocols, and safe API design", "Critical"),
            ("Zero Trust Architecture", "Security", "Identity-first least privilege access controls and micro-segmentation", "Growing"),

            # Leadership, Architecture & Product (5)
            ("System Design", "Leadership & Product", "High-level distributed architectural patterns and scalability planning", "Critical"),
            ("Software Architecture", "Leadership & Product", "Modular component design, clean code standards, and maintainability", "Critical"),
            ("Technical Leadership", "Leadership & Product", "Engineering mentorship, architectural consensus, and sprint leadership", "Growing"),
            ("Product Management", "Leadership & Product", "Product discovery, roadmapping, user research, and metrics definition", "Growing"),
            ("Cross-Functional Collaboration", "Leadership & Product", "Facilitating execution between engineering, product, and business", "Stable"),
        ]

        skill_objs = {}
        for name, category, desc, trend in skills_data:
            s = Skill.objects.create(name=name, category=category, description=desc, market_trend=trend, enterprise=novatech)
            skill_objs[name] = s

        self.stdout.write("2. Creating 50 Learning Resources...")
        providers = [
            ("TalentGraph Internal Academy", "Internal Academy"),
            ("Coursera Enterprise", "Coursera"),
            ("AWS Skill Builder", "AWS Skill Builder"),
            ("Google Cloud Skills Boost", "Google Cloud Skills"),
            ("O'Reilly Media", "O'Reilly"),
            ("DeepLearning.AI", "DeepLearning.AI"),
            ("Linux Foundation", "Linux Foundation")
        ]

        courses_specs = [
            ("Generative AI & LLM Systems in Production", "DeepLearning.AI", "Advanced LLM engineering, prompt design, embeddings, fine-tuning and evaluation.", "Advanced", 24, "Certified GenAI Practitioner", ["Generative AI", "Natural Language Processing", "Retrieval-Augmented Generation (RAG)"]),
            ("Retrieval-Augmented Generation (RAG) Deep Dive", "DeepLearning.AI", "Building production-grade vector search, reranking, and semantic chunking architectures.", "Advanced", 16, "RAG Systems Specialist", ["Retrieval-Augmented Generation (RAG)", "Natural Language Processing", "Python"]),
            ("Production Machine Learning with PyTorch", "Coursera", "PyTorch deep learning fundamentals, custom datasets, and multi-GPU training.", "Intermediate", 30, "PyTorch Deep Learning Specialist", ["PyTorch", "Deep Learning", "Machine Learning"]),
            ("MLOps Engineering: Model Deployment & Monitoring", "Coursera", "End-to-end model registry, automated pipelines, drift detection, and latency optimization.", "Advanced", 28, "MLOps Certified Architect", ["MLOps", "Docker", "CI/CD Pipelines", "Machine Learning"]),
            ("Computer Vision & Multimodal Perception", "Coursera", "Object detection, YOLO, visual embeddings, and multimodal models.", "Advanced", 32, "Computer Vision Engineer", ["Computer Vision", "Deep Learning", "Python"]),
            ("Advanced Prompt Engineering & Agentic Workflows", "Internal Academy", "Building multi-turn autonomous agent loops, tool use, and structured outputs.", "Intermediate", 12, "TalentGraph Agentic AI Badge", ["Generative AI", "Python"]),
            ("Natural Language Processing with Transformers", "O'Reilly", "Hugging Face transformer tokenization, attention mechanisms, and semantic search.", "Advanced", 20, "NLP Engineer Badge", ["Natural Language Processing", "Deep Learning", "Python"]),
            ("Applied Time Series & Forecasting Models", "Internal Academy", "Statistical and deep learning methods for time series forecasting and anomaly detection.", "Intermediate", 18, "Time Series Specialist", ["Machine Learning", "Python"]),
            
            ("Designing Scalable Distributed Systems", "O'Reilly", "Distributed consensus, caching patterns, CAP theorem, and partition tolerance.", "Advanced", 35, "Distributed Systems Architect", ["System Design", "Software Architecture", "PostgreSQL", "Redis"]),
            ("High Performance Python & Concurrency", "Internal Academy", "Asyncio, multiprocessing, GIL bypass, memory profiling, and Cython.", "Intermediate", 15, "Python Performance Expert", ["Python", "FastAPI"]),
            ("Modern Backend Microservices with FastAPI", "Internal Academy", "Building async, OpenAPI-compliant services with Pydantic validation.", "Intermediate", 14, "FastAPI Service Specialist", ["FastAPI", "Python", "Docker"]),
            ("Enterprise Django REST Framework Mastery", "Internal Academy", "ViewSets, permissions, serializers, query optimization, and caching.", "Intermediate", 16, "DRF Backend Developer", ["Django REST Framework", "Python", "PostgreSQL"]),
            ("Concurrent Programming in Go", "Coursera", "Goroutines, channels, sync primitives, and low-latency microservice design.", "Intermediate", 22, "Go Developer Certification", ["Go", "Docker"]),
            ("Enterprise Java & Spring Boot Architecture", "Coursera", "Dependency injection, reactive Spring WebFlux, and transactional data access.", "Intermediate", 30, "Spring Certified Professional", ["Java", "PostgreSQL"]),
            ("PostgreSQL Internals & Query Performance Optimization", "O'Reilly", "Query execution plans, B-Tree indexes, WAL tuning, and connection pooling.", "Advanced", 20, "PostgreSQL Performance Specialist", ["PostgreSQL", "SQL"]),
            ("Redis in Practice: Caching, Pub/Sub & Memory Models", "Internal Academy", "Redis data structures, clustered setup, eviction policies, and real-time queues.", "Intermediate", 10, "Redis Specialist Badge", ["Redis", "Python"]),

            ("Real-Time Data Streaming with Apache Kafka", "Coursera", "Event streaming architectures, consumer groups, schema registry, and exactly-once semantics.", "Advanced", 26, "Confluent Kafka Certified Developer", ["Apache Kafka", "Java", "Docker"]),
            ("Large Scale Batch & Stream Processing with Apache Spark", "O'Reilly", "RDD, DataFrames, Catalyst optimizer, PySpark tuning, and Delta Lake.", "Advanced", 30, "Spark Data Engineer Badge", ["Apache Spark", "Python", "SQL"]),
            ("Data Pipeline Orchestration with Apache Airflow", "Internal Academy", "Writing resilient DAGs, custom operators, dynamic task generation, and SLA alerts.", "Intermediate", 16, "Airflow Pipeline Specialist", ["Apache Airflow", "Python"]),
            ("Modern Analytics Engineering with dbt & Snowflake", "Coursera", "Modular SQL models, jinja macros, automated testing, and cloud data warehousing.", "Intermediate", 18, "dbt Certified Developer", ["dbt", "Snowflake", "SQL"]),
            ("Advanced SQL for Analytics & Data Modeling", "Internal Academy", "Window functions, recursive CTEs, dimensional modeling, and query tuning.", "Beginner", 12, "SQL Data Analytics Specialist", ["SQL", "Data Engineering"]),
            ("Snowflake Cloud Data Warehouse Architect", "Coursera", "Snowflake virtual warehouses, zero-copy cloning, time travel, and data governance.", "Intermediate", 20, "Snowflake SnowPro Core", ["Snowflake", "SQL"]),

            ("AWS Certified Solutions Architect - Associate", "AWS Skill Builder", "Designing resilient, high-performing, secure, and cost-optimized AWS architectures.", "Intermediate", 40, "AWS Certified Solutions Architect", ["Amazon Web Services (AWS)", "Terraform"]),
            ("AWS Advanced Networking & Serverless Specialty", "AWS Skill Builder", "VPC peering, Transit Gateway, Lambda, API Gateway, and DynamoDB.", "Advanced", 32, "AWS Serverless Specialist", ["Amazon Web Services (AWS)", "Docker"]),
            ("Google Cloud Professional Cloud Architect", "Google Cloud Skills", "GCP compute, network topology, Cloud Spanner, Vertex AI, and enterprise migration.", "Advanced", 40, "GCP Professional Cloud Architect", ["Google Cloud Platform (GCP)", "Kubernetes"]),
            ("Certified Kubernetes Administrator (CKA)", "Linux Foundation", "Kubernetes cluster architecture, networking, storage, RBAC, and troubleshooting.", "Advanced", 36, "CKA Certified Administrator", ["Kubernetes", "Docker", "Linux"]),
            ("Certified Kubernetes Application Developer (CKAD)", "Linux Foundation", "Deploying multi-container pods, configmaps, secrets, and rolling updates.", "Intermediate", 28, "CKAD Certified Developer", ["Kubernetes", "Docker"]),
            ("Infrastructure as Code with Terraform & Vault", "Coursera", "Terraform modules, state locking, remote backends, and secret injection.", "Intermediate", 20, "HashiCorp Certified Terraform Associate", ["Terraform", "Amazon Web Services (AWS)"]),
            ("Continuous Delivery & GitOps with GitHub Actions", "Internal Academy", "Automated deployment workflows, matrix builds, release gates, and container scans.", "Intermediate", 14, "DevOps Automation Badge", ["CI/CD Pipelines", "Docker"]),
            ("Docker Deep Dive & Container Security", "Linux Foundation", "Multi-stage Dockerfiles, non-root runtimes, vulnerability scanning, and cgroups.", "Beginner", 12, "Docker Container Specialist", ["Docker", "Linux"]),

            ("Enterprise React & State Management Patterns", "Internal Academy", "React 19 hooks, context providers, Zustand, performance memoization, and custom hooks.", "Intermediate", 20, "Senior React Developer", ["React", "TypeScript"]),
            ("Full-Stack TypeScript & Type Safety Mastery", "O'Reilly", "Generics, conditional types, utility types, and AST transformations.", "Intermediate", 18, "TypeScript Specialist", ["TypeScript", "React"]),
            ("Building Fast Full-Stack Apps with Next.js", "Coursera", "App router, React Server Components, server actions, and streaming SSR.", "Intermediate", 22, "Next.js Professional", ["Next.js", "React", "TypeScript"]),
            ("Modern UI Design Systems with Tailwind CSS", "Internal Academy", "Design token architecture, dark mode themes, accessibility, and fluid layouts.", "Beginner", 10, "Design Systems Specialist", ["Tailwind CSS", "React"]),

            ("Application Security & OWASP Defense in Depth", "O'Reilly", "Preventing injection attacks, CSRF, broken object level authorization, and JWT security.", "Intermediate", 22, "AppSec Practitioner", ["Application Security", "Cybersecurity"]),
            ("DevSecOps: Automated Pipeline Security & SAST", "Coursera", "SonarQube, Trivy container scanning, secret detection, and policy as code.", "Advanced", 24, "DevSecOps Certified Engineer", ["DevSecOps", "CI/CD Pipelines", "Cybersecurity"]),
            ("Zero Trust Architecture & Cloud Identity (IAM)", "Internal Academy", "Least privilege IAM policies, federated SSO, mutual TLS, and microsegmentation.", "Advanced", 20, "Zero Trust Security Badge", ["Zero Trust Architecture", "Amazon Web Services (AWS)", "Cybersecurity"]),
            ("Cloud Security & Threat Modeling", "Coursera", "Cloud security posture management (CSPM), MITRE ATT&CK matrix, and incident response.", "Advanced", 26, "Certified Cloud Security Specialist", ["Cybersecurity", "Amazon Web Services (AWS)"]),

            ("Engineering Leadership & Technical Mentorship", "Internal Academy", "1-on-1 coaching, code review culture, performance feedback, and unblocking engineers.", "Intermediate", 14, "TalentGraph Tech Lead Badge", ["Technical Leadership", "Cross-Functional Collaboration"]),
            ("Pragmatic Software Architecture & Domain-Driven Design", "O'Reilly", "Bounded contexts, aggregate roots, hexagonal architecture, and anti-corruption layers.", "Advanced", 28, "Software Architect Specialist", ["Software Architecture", "System Design"]),
            ("Cross-Functional Stakeholder Influence & Alignment", "Internal Academy", "Communicating technical debt, roadmapping with product managers, and metrics alignment.", "Intermediate", 10, "Leadership Communication Badge", ["Cross-Functional Collaboration", "Technical Leadership"]),
            ("AI Product Management: From Prototype to Production", "Coursera", "Evaluating model ROI, UX patterns for generative AI, and ethical AI guidelines.", "Intermediate", 18, "AI Product Manager Badge", ["Product Management", "Generative AI"]),
            ("Technical Product Strategy & Discovery", "Coursera", "User journey mapping, North Star metrics, rapid prototyping, and backlog prioritization.", "Intermediate", 16, "Product Strategist Badge", ["Product Management", "Cross-Functional Collaboration"]),
            
            ("Microservice Observability: OpenTelemetry & Prometheus", "Internal Academy", "Distributed tracing, metric instrumentation, log aggregation, and alert SLOs.", "Intermediate", 14, "Observability Specialist", ["System Design", "Cloud & DevOps"]),
            ("Scalable Vector Database Architecture & HNSW Indexing", "Internal Academy", "Approximate nearest neighbors, cosine indexing, quantizing, and hybrid search.", "Advanced", 16, "Vector Search Specialist", ["Retrieval-Augmented Generation (RAG)", "Python"]),
            ("High-Scale API Gateway & Rate Limiting Architectures", "Internal Academy", "Token bucket algorithms, distributed rate limits, reverse proxies, and caching.", "Advanced", 14, "API Gateway Specialist", ["System Design", "Redis", "FastAPI"]),
            ("Database Sharding, Replication & High Availability", "O'Reilly", "Read replicas, connection routing, active-active topologies, and zero-loss failover.", "Advanced", 20, "Database Reliability Engineer", ["PostgreSQL", "System Design"]),
            ("Modern Web Performance & Core Web Vitals", "Internal Academy", "Bundle splitting, critical rendering path, image compression, and hydration tuning.", "Intermediate", 12, "Frontend Performance Expert", ["React", "Next.js"]),
            ("Enterprise CI/CD Security & Supply Chain Defense", "Linux Foundation", "Sigstore, SLSA framework, SBOM generation, and reproducible container builds.", "Advanced", 16, "Supply Chain Security Badge", ["DevSecOps", "CI/CD Pipelines"]),
            ("Autonomous Multi-Agent Systems Architecture", "DeepLearning.AI", "Planning algorithms, reflection patterns, memory persistence, and tool routing for AI agents.", "Advanced", 20, "Agent Systems Architect", ["Generative AI", "Natural Language Processing", "Python"]),
        ]

        for title, prov, desc, diff, dur, cert, skill_names in courses_specs:
            lr = LearningResource.objects.create(
                enterprise=novatech,
                title=title,
                provider=prov,
                description=desc,
                difficulty=diff,
                duration_hours=dur,
                certification_name=cert,
                url=f"https://learn.talentgraph.internal/{title.lower().replace(' ', '-')}"
            )
            for sn in skill_names:
                if sn in skill_objs:
                    lr.skills_covered.add(skill_objs[sn])

        self.stdout.write("3. Creating 25 Realistic Technical Projects...")
        projects_data = [
            ("TalentGraph AI Platform v1", "Internal AI-driven talent mobility platform with semantic embeddings and skill extraction.", "Python, Django REST Framework, React, TypeScript, PostgreSQL, Docker", "Delivered working MVP for 5,000 internal enterprise users, reduced time to fill internal positions by 35%.", 6),
            ("Enterprise Generative AI Assistant", "Multi-tenant conversational LLM gateway with strict PII filtering and enterprise RAG grounding.", "Python, Generative AI, Retrieval-Augmented Generation (RAG), FastAPI, Redis", "Handled 1.2M monthly employee queries with 99.4% accuracy and zero security incidents.", 8),
            ("Real-Time Telemetry & Event Ingestion Hub", "High-throughput Kafka streaming pipeline ingesting 50,000 telemetry events per second across IoT gateways.", "Apache Kafka, Apache Spark, Python, Go, Docker, Kubernetes", "Reduced data ingestion latency from 15 minutes to under 800 milliseconds.", 7),
            ("Cloud Migration & Zero-Downtime Multi-Region Failover", "Migrated 40 core enterprise services from on-premise to AWS multi-region infrastructure using Terraform.", "Amazon Web Services (AWS), Terraform, Kubernetes, Docker, CI/CD Pipelines", "Achieved 99.99% uptime and reduced annual cloud infrastructure spend by $420,000.", 9),
            ("Automated ML Feature Store & Training Pipeline", "Scalable feature store and MLOps deployment pipeline supporting 15 predictive modeling applications.", "MLOps, PyTorch, Python, Apache Airflow, Docker", "Reduced model release cycle from 6 weeks to 3 days with automated drift alerts.", 6),
            ("NextGen Customer Analytics Data Warehouse", "Re-architected enterprise data warehouse into modern dbt and Snowflake modular data models.", "Snowflake, dbt, SQL, Apache Airflow, Python", "Accelerated executive query performance by 8x and unified 12 disparate data silos.", 5),
            ("Enterprise Zero-Trust IAM Modernization", "Implemented role-based least privilege IAM, automated token rotation, and micro-segmentation.", "Cybersecurity, Zero Trust Architecture, DevSecOps, Amazon Web Services (AWS)", "Passed SOC 2 Type II audit with zero findings and automated employee access provisioning.", 6),
            ("Real-Time Financial Fraud Detection Engine", "Deep learning graph neural network for anomaly and fraud detection on high-frequency transactions.", "Deep Learning, PyTorch, Machine Learning, Python, PostgreSQL", "Detected $3.4M in fraudulent transactions within 50ms of transaction initiation.", 8),
            ("Customer Portal Redesign & Microfrontend Architecture", "Transformed monolithic frontend into modern modular React 19 and Next.js microfrontends.", "React, TypeScript, Next.js, Tailwind CSS, CI/CD Pipelines", "Improved Lighthouse performance score from 42 to 96 and boosted mobile conversion by 28%.", 6),
            ("Kubernetes Fleet Orchestration & Service Mesh", "Standardized container platform across 180 microservices with Istio service mesh and automated mTLS.", "Kubernetes, Docker, DevSecOps, Terraform, Amazon Web Services (AWS)", "Eliminated manual service deployment errors and automated canary traffic rollouts.", 8),
            ("Intelligent Document Extraction & Semantic Parser", "Multimodal computer vision and OCR pipeline extracting structured entities from vendor contracts.", "Computer Vision, Natural Language Processing, Python, FastAPI", "Automated 85% of manual invoice verification, saving 1,200 administrative hours monthly.", 5),
            ("High-Throughput Global API Gateway", "Ultra-low latency API gateway written in Go handling 250k requests per minute with token rate limiting.", "Go, Redis, Docker, System Design, PostgreSQL", "Maintained sub-10ms p99 latency across all global endpoint locations.", 7),
            ("Customer Churn Prediction & Retention System", "End-to-end predictive modeling pipeline classifying high-risk accounts and recommending retention offers.", "Machine Learning, Python, SQL, Apache Airflow", "Decreased annual enterprise customer churn by 4.2%, preserving $1.8M ARR.", 6),
            ("Automated DevSecOps Security Scanner in CI/CD", "Integrated automated SAST/DAST container and dependency vulnerability scanners into GitHub Actions.", "DevSecOps, Application Security, CI/CD Pipelines, Docker", "Shifted security left, fixing 92% of vulnerabilities prior to staging release.", 4),
            ("Enterprise Design System Component Library", "Built cohesive accessible design system in TypeScript and Tailwind CSS utilized by 6 product teams.", "React, TypeScript, Tailwind CSS", "Cut frontend UI development sprint cycle times by 40% across all web applications.", 5),
            ("Dynamic Pricing & Demand Forecasting Engine", "Time-series forecasting models predicting localized demand surges and optimizing pricing elasticity.", "Machine Learning, Python, PostgreSQL, SQL", "Generated 8.5% incremental revenue uplift across 12 product categories.", 7),
            ("Distributed Caching & Database Performance Tuning", "Optimized PostgreSQL indexing and multi-layer Redis caching for high-load transaction system.", "PostgreSQL, Redis, System Design, Python", "Reduced database CPU utilization from 90% peak to 35% under double traffic load.", 4),
            ("Self-Service Data Mesh Platform", "Democratized data access by deploying domain-oriented data products with automated data contracts.", "dbt, Snowflake, Apache Kafka, SQL", "Empowered 8 business units to build their own analytical pipelines without engineering bottlenecks.", 8),
            ("Automated Compliance & Audit Telemetry System", "Continuous automated compliance monitoring verifying cloud posture against CIS benchmarks.", "Cybersecurity, Amazon Web Services (AWS), Terraform, Python", "Reduced audit preparation time from 4 weeks to 2 hours of automated report generation.", 5),
            ("Agentic Workflow Orchestrator for Operations", "Internal agentic workflow engine executing automated multi-step IT support ticket resolutions.", "Generative AI, Python, FastAPI, Docker", "Resolved 45% of tier-1 IT tickets without human intervention in under 60 seconds.", 6),
            ("Cloud Cost Optimization & FinOps Initiative", "Automated unused resource termination, spot instance fleets, and right-sizing across AWS & GCP.", "Amazon Web Services (AWS), Google Cloud Platform (GCP), Terraform, Python", "Saved $650,000 annually in unallocated compute and idle storage costs.", 6),
            ("Executive Mobile Intelligence Dashboard", "Cross-platform executive reporting application with real-time KPI alerts and interactive visualizations.", "React, TypeScript, Tailwind CSS, Next.js", "Adopted by C-suite executives for daily company metric reviews.", 5),
            ("Cross-Cloud Disaster Recovery & Active-Active Rebalancing", "Engineered multi-cloud data synchronization and traffic re-routing across AWS and GCP.", "Amazon Web Services (AWS), Google Cloud Platform (GCP), Kubernetes, Terraform", "Proved 45-second RTO and zero data loss in quarterly simulated disaster drill.", 7),
            ("Supply Chain Route Optimization Platform", "Heuristic optimization algorithm for freight routing and delivery vehicle schedule minimization.", "Python, Machine Learning, SQL, PostgreSQL", "Reduced fuel consumption by 11% and improved on-time delivery rates to 98.6%.", 8),
            ("Internal Developer Platform (IDP) & Service Scaffolder", "Self-service developer portal allowing teams to provision compliant microservices in under 5 minutes.", "TypeScript, React, Docker, Kubernetes, CI/CD Pipelines", "Reduced new service onboarding time from 3 weeks to 15 minutes.", 6),
            ("Project Titan: Autonomous LLM Agent Core", "Proprietary high-security multi-agent reasoning cluster with sandboxed execution.", "Generative AI, Python, MLOps, PyTorch, Kubernetes", "Core enterprise algorithmic IP.", 12),
        ]

        project_objs = []
        for idx, (name, desc, techs, outcomes, dur) in enumerate(projects_data):
            sens = 'HR_ONLY' if idx == len(projects_data) - 1 else 'ENTERPRISE_PUBLIC'
            ai_mode = 'AI_SAFE_SUMMARY' if sens == 'HR_ONLY' else 'AI_ALLOWED'
            p = Project.objects.create(
                enterprise=novatech,
                name=name,
                description=desc,
                technologies=techs,
                outcomes=outcomes,
                duration_months=dur,
                sensitivity_level=sens,
                ai_processing_mode=ai_mode
            )
            project_objs.append(p)

        self.stdout.write("4. Creating 15 Diverse Enterprise Roles...")
        roles_data = [
            # AI Research & Platform (3)
            (
                "Staff AI/ML Platform Engineer", "AI Research",
                "Architect and scale enterprise LLM infrastructure, distributed model serving, and high-performance vector retrieval pipelines.",
                "Lead the technical roadmap for AI model infrastructure. Design distributed training and inference clusters. Mentor senior ML engineers.",
                6.0, "Critical",
                [
                    ("Generative AI", "Essential", "Advanced", True),
                    ("Retrieval-Augmented Generation (RAG)", "Essential", "Advanced", True),
                    ("MLOps", "Essential", "Advanced", True),
                    ("PyTorch", "Essential", "Advanced", True),
                    ("Python", "Essential", "Expert", True),
                    ("Kubernetes", "Preferred", "Intermediate", False),
                    ("System Design", "Essential", "Advanced", True),
                    ("Technical Leadership", "Preferred", "Intermediate", False),
                ]
            ),
            (
                "Senior Machine Learning Engineer", "AI Research",
                "Develop, train, and deploy predictive and deep learning models into production systems.",
                "Build feature pipelines, train deep neural networks, optimize model inference latency, and monitor production drift.",
                4.0, "Critical",
                [
                    ("Machine Learning", "Essential", "Advanced", True),
                    ("Deep Learning", "Essential", "Intermediate", True),
                    ("PyTorch", "Essential", "Intermediate", True),
                    ("Python", "Essential", "Advanced", True),
                    ("MLOps", "Preferred", "Intermediate", False),
                    ("SQL", "Preferred", "Intermediate", False),
                    ("Docker", "Preferred", "Intermediate", False),
                ]
            ),
            (
                "Lead Applied AI Research Scientist", "AI Research",
                "Pioneer proprietary generative AI architectures, multimodal systems, and agentic workflows for enterprise automation.",
                "Formulate novel algorithmic approaches, publish internal research benchmarks, and collaborate with engineering on productization.",
                7.0, "High",
                [
                    ("Generative AI", "Essential", "Expert", True),
                    ("Natural Language Processing", "Essential", "Advanced", True),
                    ("Deep Learning", "Essential", "Advanced", True),
                    ("PyTorch", "Essential", "Advanced", True),
                    ("Computer Vision", "Preferred", "Intermediate", False),
                    ("Software Architecture", "Preferred", "Intermediate", False),
                ]
            ),

            # Engineering (4)
            (
                "Principal Distributed Systems Architect", "Engineering",
                "Drive enterprise-wide backend architecture, distributed consistency standards, and mission-critical system resilience.",
                "Define architectural guidelines across 30+ engineering squads. Lead system design reviews. Solve high-scale performance bottlenecks.",
                8.0, "Critical",
                [
                    ("System Design", "Essential", "Expert", True),
                    ("Software Architecture", "Essential", "Expert", True),
                    ("Python", "Essential", "Advanced", True),
                    ("Go", "Preferred", "Intermediate", False),
                    ("PostgreSQL", "Essential", "Advanced", True),
                    ("Redis", "Essential", "Advanced", True),
                    ("Technical Leadership", "Essential", "Advanced", True),
                ]
            ),
            (
                "Senior Backend Software Engineer", "Engineering",
                "Design, build, and maintain high-reliability REST and event-driven microservices in Python and PostgreSQL.",
                "Write clean, tested API endpoints. Optimize database queries. Collaborate with frontend and cloud infrastructure teams.",
                4.0, "High",
                [
                    ("Python", "Essential", "Advanced", True),
                    ("Django REST Framework", "Essential", "Advanced", True),
                    ("PostgreSQL", "Essential", "Intermediate", True),
                    ("Redis", "Preferred", "Intermediate", False),
                    ("Docker", "Preferred", "Intermediate", False),
                    ("CI/CD Pipelines", "Preferred", "Intermediate", False),
                ]
            ),
            (
                "Lead Full-Stack Applications Engineer", "Engineering",
                "Lead full-stack product development combining modern React frontends with resilient Python/FastAPI microservices.",
                "Oversee technical delivery of cross-functional user experiences. Ensure high code quality, accessibility, and fast load times.",
                5.0, "High",
                [
                    ("React", "Essential", "Advanced", True),
                    ("TypeScript", "Essential", "Advanced", True),
                    ("Python", "Essential", "Advanced", True),
                    ("FastAPI", "Preferred", "Intermediate", False),
                    ("Tailwind CSS", "Preferred", "Intermediate", False),
                    ("Technical Leadership", "Preferred", "Intermediate", False),
                ]
            ),
            (
                "Senior Frontend Engineer", "Engineering",
                "Craft responsive, highly polished, accessible, and performant web user interfaces.",
                "Build reusable UI component design systems, integrate REST/GraphQL APIs, and optimize Core Web Vitals.",
                4.0, "Moderate",
                [
                    ("React", "Essential", "Advanced", True),
                    ("TypeScript", "Essential", "Advanced", True),
                    ("Next.js", "Preferred", "Intermediate", False),
                    ("Tailwind CSS", "Essential", "Intermediate", True),
                    ("CI/CD Pipelines", "Preferred", "Beginner", False),
                ]
            ),

            # Data Platform (3)
            (
                "Staff Data Platform Architect", "Data Platform",
                "Design enterprise real-time streaming topologies, data lakehouses, and governance frameworks.",
                "Architect event streaming pipelines with Kafka and Spark. Set data quality contracts. Lead data engineering strategy.",
                7.0, "Critical",
                [
                    ("Apache Kafka", "Essential", "Advanced", True),
                    ("Apache Spark", "Essential", "Advanced", True),
                    ("Snowflake", "Essential", "Advanced", True),
                    ("dbt", "Preferred", "Intermediate", False),
                    ("System Design", "Essential", "Advanced", True),
                    ("SQL", "Essential", "Expert", True),
                    ("Python", "Essential", "Advanced", True),
                ]
            ),
            (
                "Senior Data Engineer", "Data Platform",
                "Construct reliable batch and streaming data pipelines connecting disparate enterprise sources.",
                "Develop Airflow DAGs, write dbt transformations, maintain data schemas, and ensure pipeline SLAs.",
                4.0, "High",
                [
                    ("SQL", "Essential", "Advanced", True),
                    ("Python", "Essential", "Advanced", True),
                    ("Apache Airflow", "Essential", "Intermediate", True),
                    ("dbt", "Preferred", "Intermediate", False),
                    ("Snowflake", "Preferred", "Intermediate", False),
                    ("PostgreSQL", "Preferred", "Intermediate", False),
                ]
            ),
            (
                "Lead Analytics Engineer", "Data Platform",
                "Bridge the gap between raw data pipelines and executive business intelligence dashboards.",
                "Build dimensional data models, implement automated semantic layers, and empower data analysts.",
                5.0, "High",
                [
                    ("dbt", "Essential", "Advanced", True),
                    ("SQL", "Essential", "Expert", True),
                    ("Snowflake", "Essential", "Intermediate", True),
                    ("Python", "Preferred", "Intermediate", False),
                    ("Cross-Functional Collaboration", "Essential", "Intermediate", True),
                ]
            ),

            # Cloud Architecture (2)
            (
                "Principal Cloud & DevOps Architect", "Cloud Architecture",
                "Direct global multi-cloud infrastructure strategy, Kubernetes adoption, and Infrastructure-as-Code standards.",
                "Define cloud landing zones, establish FinOps cost guardrails, automate disaster recovery, and ensure 99.99% system availability.",
                8.0, "Critical",
                [
                    ("Amazon Web Services (AWS)", "Essential", "Expert", True),
                    ("Kubernetes", "Essential", "Advanced", True),
                    ("Terraform", "Essential", "Advanced", True),
                    ("Docker", "Essential", "Advanced", True),
                    ("System Design", "Essential", "Advanced", True),
                    ("Google Cloud Platform (GCP)", "Preferred", "Intermediate", False),
                ]
            ),
            (
                "Senior Site Reliability Engineer (SRE)", "Cloud Architecture",
                "Ensure production service reliability, automate self-healing deployments, and manage observability stacks.",
                "Implement OpenTelemetry tracing, manage Kubernetes clusters, reduce incident MTTR, and run post-mortems.",
                4.0, "High",
                [
                    ("Kubernetes", "Essential", "Intermediate", True),
                    ("Docker", "Essential", "Advanced", True),
                    ("CI/CD Pipelines", "Essential", "Advanced", True),
                    ("Amazon Web Services (AWS)", "Preferred", "Intermediate", False),
                    ("Python", "Preferred", "Intermediate", False),
                    ("Terraform", "Preferred", "Intermediate", False),
                ]
            ),

            # Security (1)
            (
                "Lead DevSecOps & Security Architect", "Security",
                "Embed shift-left automated security guardrails, vulnerability management, and Zero Trust access into developer workflows.",
                "Conduct threat models, manage automated CI/CD security scanning, lead compliance audits, and implement zero-trust network policies.",
                6.0, "Critical",
                [
                    ("Cybersecurity", "Essential", "Advanced", True),
                    ("DevSecOps", "Essential", "Advanced", True),
                    ("Application Security", "Essential", "Advanced", True),
                    ("Zero Trust Architecture", "Essential", "Intermediate", True),
                    ("CI/CD Pipelines", "Preferred", "Intermediate", False),
                    ("Amazon Web Services (AWS)", "Preferred", "Intermediate", False),
                ]
            ),

            # Product (2)
            (
                "Director of AI Product Management", "Product",
                "Lead enterprise product strategy for AI-powered workforce intelligence and autonomous agent solutions.",
                "Define product vision, synthesize user research, align executive stakeholders, and drive product-led growth metrics.",
                7.0, "High",
                [
                    ("Product Management", "Essential", "Expert", True),
                    ("Generative AI", "Essential", "Intermediate", True),
                    ("Cross-Functional Collaboration", "Essential", "Expert", True),
                    ("Technical Leadership", "Essential", "Advanced", True),
                    ("System Design", "Preferred", "Intermediate", False),
                ]
            ),
            (
                "Senior Technical Product Manager", "Product",
                "Translate complex enterprise developer platform requirements into actionable sprint roadmaps and user stories.",
                "Partner with engineering leads, conduct customer discovery interviews, and define feature acceptance criteria.",
                4.0, "Moderate",
                [
                    ("Product Management", "Essential", "Advanced", True),
                    ("Cross-Functional Collaboration", "Essential", "Advanced", True),
                    ("Software Architecture", "Preferred", "Beginner", False),
                    ("System Design", "Preferred", "Beginner", False),
                ]
            ),
        ]

        role_objs = []
        for title, dept, desc, resp, exp, demand, rskills in roles_data:
            role = Role.objects.create(
                enterprise=novatech,
                title=title,
                department=dept,
                description=desc,
                responsibilities=resp,
                required_experience_years=exp,
                future_demand_level=demand,
            )
            # Generate and cache role embedding
            role_text = build_role_text_context(role)
            role.embedding = get_text_embedding(role_text)
            role.save(update_fields=['embedding'])
            role_objs.append(role)

            for sname, imp, min_prof, is_req in rskills:
                if sname in skill_objs:
                    RoleSkill.objects.create(
                        role=role,
                        skill=skill_objs[sname],
                        importance=imp,
                        minimum_proficiency=min_prof,
                        is_required=is_req
                    )

        self.stdout.write("5. Creating 30 Realistic Employees with Complete Profiles...")
        employees_specs = [
            # 1. Alex Rivera - Senior Backend ready for Staff AI Platform
            ("Alex Rivera", "alex.rivera@talentgraph.internal", "Engineering", "Senior Backend Software Engineer", 5.5,
             "B.S. in Computer Science, UC Berkeley", "AWS Solutions Architect, CKAD",
             "Senior backend engineer passionate about distributed data systems, async Python architectures, and scaling AI inference endpoints.",
             "Generative AI, Large Scale Distributed Systems, MLOps",
             [("Python", "Expert", 0.95, "explicit", "5+ years developing high-throughput services"),
              ("Django REST Framework", "Advanced", 0.92, "explicit", "Core contributor to internal API platforms"),
              ("PostgreSQL", "Advanced", 0.90, "explicit", "Optimized complex transactional databases"),
              ("Redis", "Advanced", 0.88, "explicit", "Implemented multi-tier caching architectures"),
              ("Docker", "Advanced", 0.85, "explicit", "Standardized container runtime environments"),
              ("Generative AI", "Intermediate", 0.82, "project_inferred", "Implemented LLM orchestrator in Enterprise AI Assistant project"),
              ("Retrieval-Augmented Generation (RAG)", "Intermediate", 0.80, "project_inferred", "Built vector search retrieval service in RAG initiative"),
              ("PyTorch", "Beginner", 0.70, "learning", "Completed DeepLearning.AI PyTorch course"),
              ("System Design", "Advanced", 0.86, "ai_discovered", "Architected global rate limiting and caching topologies"),
              ("Technical Leadership", "Intermediate", 0.80, "ai_discovered", "Mentored 3 junior backend engineers on API standards")],
             [0, 1, 16], # Projects
             "Staff AI/ML Platform Engineer"),

            # 2. Priya Sharma - Machine Learning Engineer aiming for Lead Applied AI Scientist
            ("Priya Sharma", "priya.sharma@talentgraph.internal", "AI Research", "Senior Machine Learning Engineer", 4.8,
             "M.S. in Machine Learning, Carnegie Mellon University", "DeepLearning.AI Certified, AWS ML Specialty",
             "ML engineer focused on deep neural architectures, prompt optimization, and production NLP models.",
             "Multimodal AI, LLM Evaluation, Autonomous Agents",
             [("Machine Learning", "Expert", 0.96, "explicit", "Led fraud detection and churn prediction modeling"),
              ("Deep Learning", "Advanced", 0.92, "explicit", "Trained transformer and GNN models"),
              ("PyTorch", "Advanced", 0.94, "explicit", "Primary deep learning framework used across 4 production initiatives"),
              ("Python", "Expert", 0.95, "explicit", "Core language for data modeling and ML inference"),
              ("Natural Language Processing", "Advanced", 0.89, "project_inferred", "Trained entity extraction and semantic search models"),
              ("Generative AI", "Advanced", 0.87, "project_inferred", "Architected prompt routing and agent evaluation frameworks"),
              ("MLOps", "Intermediate", 0.78, "learning", "Maintains automated model feature stores and Airflow DAGs"),
              ("SQL", "Intermediate", 0.80, "explicit", "Queries enterprise data warehouse for training set creation")],
             [1, 4, 7],
             "Lead Applied AI Research Scientist"),

            # 3. Marcus Chen - Principal Architect
            ("Marcus Chen", "marcus.chen@talentgraph.internal", "Engineering", "Principal Distributed Systems Architect", 9.2,
             "M.S. in Computer Science, Stanford University", "AWS Solutions Architect Professional, CKA",
             "Veteran systems architect who designs ultra-high availability microservices, distributed data meshes, and enterprise scalability roadmaps.",
             "Fault-Tolerant Architectures, Global Data Consistency, FinOps",
             [("System Design", "Expert", 0.98, "explicit", "Designed multi-region failover and distributed event buses"),
              ("Software Architecture", "Expert", 0.97, "explicit", "Established enterprise clean architecture standards"),
              ("Python", "Expert", 0.94, "explicit", "Built core backend microservices"),
              ("PostgreSQL", "Expert", 0.93, "explicit", "Authored database partitioning and replication topologies"),
              ("Redis", "Expert", 0.92, "explicit", "Architected distributed locking and global session caches"),
              ("Technical Leadership", "Expert", 0.95, "explicit", "Leads company-wide architecture review board"),
              ("Amazon Web Services (AWS)", "Advanced", 0.88, "explicit", "Designed multi-region VPC and ECS topologies"),
              ("Kubernetes", "Intermediate", 0.82, "project_inferred", "Led service migration onto container clusters")],
             [0, 3, 11, 16],
             "Principal Distributed Systems Architect"),

            # 4. Sarah Jenkins - Senior Data Engineer targeting Staff Data Architect
            ("Sarah Jenkins", "sarah.jenkins@talentgraph.internal", "Data Platform", "Senior Data Engineer", 5.0,
             "B.S. in Data Analytics, University of Michigan", "Snowflake SnowPro, dbt Certified Developer",
             "Data platform specialist with deep experience in Kafka streaming, Snowflake warehouse architecture, and dbt data transformations.",
             "Real-Time Streaming, Data Contracts, Apache Iceberg",
             [("SQL", "Expert", 0.96, "explicit", "Authored 100+ complex analytical transformations"),
              ("Python", "Advanced", 0.90, "explicit", "Developed Airflow DAGs and custom data connectors"),
              ("Snowflake", "Advanced", 0.92, "explicit", "Designed analytics warehouse models"),
              ("dbt", "Advanced", 0.91, "explicit", "Standardized modular SQL transformations across squads"),
              ("Apache Airflow", "Advanced", 0.88, "explicit", "Maintains production ETL scheduling cluster"),
              ("Apache Kafka", "Intermediate", 0.80, "project_inferred", "Ingested real-time event streams in Telemetry Hub"),
              ("Apache Spark", "Intermediate", 0.76, "learning", "Completed Spark cluster processing masterclass"),
              ("Cross-Functional Collaboration", "Intermediate", 0.82, "ai_discovered", "Partnered with BI and finance teams to unify metrics")],
             [2, 5, 17],
             "Staff Data Platform Architect"),

            # 5. Elena Rostova - DevOps Engineer aiming for SRE Lead
            ("Elena Rostova", "elena.rostova@talentgraph.internal", "Cloud Architecture", "Senior Site Reliability Engineer (SRE)", 4.5,
             "B.S. in Computer Engineering, Georgia Tech", "CKA, HashiCorp Terraform Associate",
             "Infrastructure automation engineer passionate about GitOps, Kubernetes cluster operations, and zero-downtime canary deployments.",
             "Chaos Engineering, Observability, Service Mesh",
             [("Kubernetes", "Advanced", 0.93, "explicit", "Manages production EKS clusters with automated autoscaling"),
              ("Docker", "Expert", 0.95, "explicit", "Optimized container build pipelines and slim runtimes"),
              ("CI/CD Pipelines", "Advanced", 0.92, "explicit", "Built automated GitHub Actions deployment gates"),
              ("Terraform", "Advanced", 0.90, "explicit", "Automated multi-account AWS infrastructure as code"),
              ("Amazon Web Services (AWS)", "Advanced", 0.88, "explicit", "Configured IAM, VPC peering, and CloudWatch metrics"),
              ("Python", "Intermediate", 0.80, "explicit", "Authored custom infrastructure automation and bot scripts"),
              ("Cybersecurity", "Intermediate", 0.78, "project_inferred", "Automated container vulnerability scanning in CI/CD")],
             [3, 9, 13, 20],
             "Principal Cloud & DevOps Architect"),

            # 6. David Kim - Frontend Engineer targeting Lead Full-Stack
            ("David Kim", "david.kim@talentgraph.internal", "Engineering", "Senior Frontend Engineer", 4.2,
             "B.A. in Interactive Media, NYU", "Meta Frontend Certified",
             "Frontend specialist creating rich reactive interfaces, component libraries, and performant web applications.",
             "Design Systems, Microfrontends, Web Performance",
             [("React", "Expert", 0.96, "explicit", "Engineered core dashboard UI for TalentGraph platform"),
              ("TypeScript", "Advanced", 0.92, "explicit", "Strict typing and component design patterns"),
              ("Tailwind CSS", "Expert", 0.95, "explicit", "Created accessible enterprise UI theme and glassmorphic designs"),
              ("Next.js", "Advanced", 0.88, "explicit", "Implemented server-side rendering and static optimization"),
              ("Python", "Intermediate", 0.72, "learning", "Learning FastAPI and backend REST conventions"),
              ("System Design", "Intermediate", 0.75, "ai_discovered", "Architected frontend state cache and microfrontend boundaries")],
             [0, 8, 14, 21],
             "Lead Full-Stack Applications Engineer"),

            # 7. Maya Patel - Senior PM moving towards Director of AI Product
            ("Maya Patel", "maya.patel@talentgraph.internal", "Product", "Senior Technical Product Manager", 5.8,
             "MBA, Northwestern Kellogg; B.S. in Computer Science", "Certified Scrum Product Owner",
             "Product leader bridging complex AI technologies with customer workflows to deliver measurable business impact.",
             "AI Product Strategy, Talent Intelligence, Human-AI Collaboration",
             [("Product Management", "Expert", 0.96, "explicit", "Led product roadmap for enterprise internal mobility suite"),
              ("Cross-Functional Collaboration", "Expert", 0.95, "explicit", "Orchestrated delivery across engineering, design, and HR"),
              ("Technical Leadership", "Advanced", 0.88, "explicit", "Led agile sprint rituals and technical backlog discovery"),
              ("Generative AI", "Intermediate", 0.80, "project_inferred", "Defined requirements and evaluation metrics for AI Assistant"),
              ("Software Architecture", "Intermediate", 0.74, "ai_discovered", "Contributed to high-level platform capability boundaries")],
             [0, 1, 19],
             "Director of AI Product Management"),

            # 8. Jordan Taylor - Security Specialist aiming for Lead DevSecOps
            ("Jordan Taylor", "jordan.taylor@talentgraph.internal", "Security", "Senior Security Engineer", 5.2,
             "B.S. in Cybersecurity, Purdue University", "CISSP, AWS Security Specialty",
             "Security architect specializing in threat modeling, DevSecOps automation, and Zero Trust access management.",
             "Cloud Security Posture, AppSec, Automated Compliance",
             [("Cybersecurity", "Expert", 0.95, "explicit", "Led threat modeling and SOC 2 compliance readiness"),
              ("DevSecOps", "Advanced", 0.92, "explicit", "Integrated automated security scanning in CI/CD"),
              ("Application Security", "Advanced", 0.90, "explicit", "Performed secure code audits and OWASP mitigation"),
              ("Zero Trust Architecture", "Advanced", 0.88, "explicit", "Implemented identity-first least privilege access"),
              ("Amazon Web Services (AWS)", "Intermediate", 0.82, "explicit", "Audited IAM roles and security groups"),
              ("Python", "Intermediate", 0.78, "project_inferred", "Automated compliance telemetry scripts")],
             [6, 13, 18],
             "Lead DevSecOps & Security Architect"),

            # 9. Rachel Green - Analytics Engineer targeting Lead Analytics Engineer
            ("Rachel Green", "rachel.green@talentgraph.internal", "Data Platform", "Senior Data Analyst", 3.8,
             "B.S. in Statistics, UC Davis", "dbt Certified Practitioner",
             "Data specialist focused on turning raw enterprise metrics into intuitive self-service BI dashboards and semantic data layers.",
             "Data Modeling, Executive Storytelling, Metric Standardization",
             [("SQL", "Expert", 0.95, "explicit", "Crafted advanced analytical models and cohort analysis"),
              ("dbt", "Advanced", 0.89, "explicit", "Implemented modular data transformation DAGs"),
              ("Snowflake", "Intermediate", 0.84, "explicit", "Manages reporting schemas and warehouse queries"),
              ("Python", "Intermediate", 0.78, "learning", "Writing pandas data cleaning scripts"),
              ("Cross-Functional Collaboration", "Advanced", 0.88, "explicit", "Works daily with marketing and operations leaders")],
             [5, 12, 17],
             "Lead Analytics Engineer"),

            # 10. Liam Murphy - Mid Software Engineer targeting Senior Backend
            ("Liam Murphy", "liam.murphy@talentgraph.internal", "Engineering", "Software Engineer II", 3.1,
             "B.S. in Software Engineering, University of Washington", "AWS Certified Developer",
             "Ambitious backend engineer building clean REST APIs and asynchronous background jobs with Python and Django.",
             "Distributed Caching, Event-Driven Architectures, FastAPI",
             [("Python", "Advanced", 0.89, "explicit", "Developed core API endpoints and background workers"),
              ("Django REST Framework", "Advanced", 0.88, "explicit", "Implemented serializers, viewsets, and filter sets"),
              ("PostgreSQL", "Intermediate", 0.82, "explicit", "Designed table schemas and foreign key constraints"),
              ("Docker", "Intermediate", 0.78, "explicit", "Containerized microservice development environments"),
              ("Redis", "Intermediate", 0.75, "project_inferred", "Added caching to slow database queries"),
              ("CI/CD Pipelines", "Intermediate", 0.74, "learning", "Maintains GitHub Actions test automation")],
             [0, 16],
             "Senior Backend Software Engineer"),

            # 11. Carlos Gomez - Mid ML Engineer targeting Senior ML Engineer
            ("Carlos Gomez", "carlos.gomez@talentgraph.internal", "AI Research", "Machine Learning Engineer I", 2.5,
             "B.S. in Artificial Intelligence, UT Austin", "TensorFlow Certified",
             "Junior ML practitioner with solid foundation in predictive algorithms, data wrangling, and scikit-learn/PyTorch pipelines.",
             "Deep Learning, Computer Vision, MLOps",
             [("Machine Learning", "Advanced", 0.88, "explicit", "Built customer churn classification models"),
              ("Python", "Advanced", 0.90, "explicit", "Data analysis, numpy, pandas, and scikit-learn"),
              ("PyTorch", "Intermediate", 0.78, "explicit", "Trained convolutional and recurrent neural models"),
              ("SQL", "Intermediate", 0.80, "explicit", "Extracted training features from data warehouse"),
              ("MLOps", "Beginner", 0.65, "learning", "Enrolled in MLOps Engineering Coursera course"),
              ("Docker", "Intermediate", 0.72, "project_inferred", "Packaged model endpoints into Docker images")],
             [4, 12],
             "Senior Machine Learning Engineer"),

            # 12. Aisha Al-Mansoor - Senior Cloud Architect
            ("Aisha Al-Mansoor", "aisha.almansoor@talentgraph.internal", "Cloud Architecture", "Senior Cloud Infrastructure Architect", 6.2,
             "M.S. in Information Systems, MIT", "AWS Certified Solutions Architect Professional, GCP Cloud Architect",
             "Cloud systems expert specialized in multi-cloud governance, hybrid topologies, and Terraform IaC automation.",
             "Multi-Cloud Architecture, FinOps, Disaster Recovery",
             [("Amazon Web Services (AWS)", "Expert", 0.96, "explicit", "Architected multi-region AWS cloud foundation"),
              ("Google Cloud Platform (GCP)", "Advanced", 0.90, "explicit", "Configured BigQuery and Vertex AI VPC interconnects"),
              ("Terraform", "Expert", 0.94, "explicit", "Created reusable enterprise infrastructure modules"),
              ("Kubernetes", "Advanced", 0.88, "explicit", "Configured enterprise EKS and GKE clusters"),
              ("System Design", "Advanced", 0.90, "explicit", "Designed multi-cloud disaster recovery architectures"),
              ("Docker", "Advanced", 0.88, "explicit", "Standardized container runtime baselines")],
             [3, 20, 22],
             "Principal Cloud & DevOps Architect"),

            # 13. Ethan Wright - Lead Full-Stack Engineer
            ("Ethan Wright", "ethan.wright@talentgraph.internal", "Engineering", "Lead Full-Stack Applications Engineer", 6.0,
             "B.S. in Computer Science, UIUC", "AWS Certified Developer",
             "Full-stack team lead passionate about modern web apps, API architecture, and seamless developer experiences.",
             "React Architecture, Microfrontends, API Design",
             [("React", "Expert", 0.94, "explicit", "Architected component libraries across multiple platforms"),
              ("TypeScript", "Expert", 0.93, "explicit", "End-to-end type safety from database to UI"),
              ("Python", "Advanced", 0.90, "explicit", "Built backend REST services with DRF and FastAPI"),
              ("FastAPI", "Advanced", 0.88, "explicit", "Built high-speed microservices for portal backend"),
              ("Tailwind CSS", "Advanced", 0.90, "explicit", "Created accessible dark mode enterprise UI"),
              ("Technical Leadership", "Advanced", 0.86, "explicit", "Leads frontend squad of 5 engineers"),
              ("CI/CD Pipelines", "Intermediate", 0.80, "project_inferred", "Automated UI testing and preview environments")],
             [0, 8, 24],
             "Principal Distributed Systems Architect"),

            # 14. Sophia Martinez - NLP Specialist targeting Lead Applied AI Scientist
            ("Sophia Martinez", "sophia.martinez@talentgraph.internal", "AI Research", "Senior NLP & AI Engineer", 5.1,
             "Ph.D. in Computational Linguistics, Columbia University", "DeepLearning.AI NLP Specialist",
             "NLP specialist with expertise in tokenization, attention mechanisms, fine-tuning LLMs, and semantic search.",
             "Retrieval-Augmented Generation, Agentic AI, Multilingual NLP",
             [("Natural Language Processing", "Expert", 0.97, "explicit", "Published internal research on transformer fine-tuning"),
              ("Generative AI", "Advanced", 0.92, "explicit", "Built RAG systems with reranking and semantic chunking"),
              ("Retrieval-Augmented Generation (RAG)", "Advanced", 0.94, "explicit", "Optimized vector search recall in Enterprise Assistant"),
              ("Python", "Expert", 0.95, "explicit", "Primary research and development language"),
              ("PyTorch", "Advanced", 0.91, "explicit", "Implemented custom attention layers and embedding models"),
              ("Deep Learning", "Advanced", 0.90, "explicit", "Deep neural network optimization")],
             [1, 10, 19],
             "Lead Applied AI Research Scientist"),

            # 15. Kevin Zhang - Cloud DevOps Engineer targeting Senior SRE
            ("Kevin Zhang", "kevin.zhang@talentgraph.internal", "Cloud Architecture", "DevOps Engineer II", 3.4,
             "B.S. in Telecommunications, Penn State", "AWS SysOps Administrator",
             "Cloud operations engineer focused on containerization, automated build pipelines, and cloud monitoring.",
             "Kubernetes, Terraform, Prometheus Observability",
             [("Docker", "Advanced", 0.90, "explicit", "Containerized legacy applications for cloud deployment"),
              ("CI/CD Pipelines", "Advanced", 0.88, "explicit", "Maintains Jenkins and GitHub Actions pipelines"),
              ("Amazon Web Services (AWS)", "Intermediate", 0.82, "explicit", "Configured EC2, S3, and CloudWatch alerts"),
              ("Kubernetes", "Intermediate", 0.78, "learning", "Enrolled in CKA certification course"),
              ("Terraform", "Intermediate", 0.76, "project_inferred", "Provisioned testing environments via IaC")],
             [3, 9],
             "Senior Site Reliability Engineer (SRE)"),

            # 16. Nina Patel - Data Analyst targeting Senior Data Engineer
            ("Nina Patel", "nina.patel@talentgraph.internal", "Data Platform", "Data Analyst II", 3.0,
             "B.S. in Information Systems, Ohio State University", "SQL Certified Specialist",
             "Data analyst proficient in SQL query tuning, exploratory data analysis, and Airflow pipeline scheduling.",
             "Data Engineering, Apache Airflow, Snowflake",
             [("SQL", "Advanced", 0.92, "explicit", "Built reporting data marts and ETL queries"),
              ("Python", "Intermediate", 0.80, "explicit", "Data manipulation with pandas and openpyxl"),
              ("Apache Airflow", "Intermediate", 0.74, "learning", "Building custom DAGs in Airflow course"),
              ("PostgreSQL", "Intermediate", 0.76, "explicit", "Wrote complex analytical queries"),
              ("dbt", "Beginner", 0.65, "learning", "Currently studying dbt Fundamentals")],
             [5, 12],
             "Senior Data Engineer"),

            # 17. Oliver Scott - Backend Engineer targeting Senior Backend
            ("Oliver Scott", "oliver.scott@talentgraph.internal", "Engineering", "Backend Software Engineer", 2.8,
             "B.S. in Computer Science, UC San Diego", "Python Institute PCAP",
             "Backend engineer specializing in REST APIs, Django model design, and PostgreSQL database queries.",
             "Async Python, Redis Caching, Distributed Systems",
             [("Python", "Advanced", 0.88, "explicit", "Developed core CRUD APIs for talent platform"),
              ("Django REST Framework", "Advanced", 0.86, "explicit", "Implemented authentication and serializer validations"),
              ("PostgreSQL", "Intermediate", 0.80, "explicit", "Optimized foreign keys and indexes"),
              ("Redis", "Beginner", 0.68, "learning", "Enrolled in Redis in Practice masterclass"),
              ("Docker", "Intermediate", 0.75, "project_inferred", "Configured multi-container docker compose setups")],
             [0, 16],
             "Senior Backend Software Engineer"),

            # 18. Isabella Rossi - Product Manager targeting Senior Technical PM
            ("Isabella Rossi", "isabella.rossi@talentgraph.internal", "Product", "Technical Product Manager I", 3.2,
             "B.A. in Cognitive Science, UC Berkeley", "Scrum Master Certified",
             "Product manager focused on agile sprint delivery, developer tooling, and enterprise UX research.",
             "Developer Platforms, API Products, AI UX",
             [("Product Management", "Advanced", 0.89, "explicit", "Managed backlog and sprint rituals for developer platform"),
              ("Cross-Functional Collaboration", "Advanced", 0.90, "explicit", "Facilitated alignment between dev and business units"),
              ("Technical Leadership", "Intermediate", 0.76, "ai_discovered", "Authored technical RFCs and feature specs"),
              ("Software Architecture", "Beginner", 0.65, "learning", "Studying Domain-Driven Design")],
             [24],
             "Senior Technical Product Manager"),

            # 19. Brandon Vance - Security Analyst targeting Senior Security Engineer
            ("Brandon Vance", "brandon.vance@talentgraph.internal", "Security", "Security Analyst II", 3.0,
             "B.S. in Information Assurance, Rochester Institute of Technology", "CompTIA Security+",
             "Security practitioner focused on vulnerability triage, static code analysis, and automated compliance monitoring.",
             "DevSecOps, Cloud Security, Threat Modeling",
             [("Cybersecurity", "Advanced", 0.88, "explicit", "Triage vulnerability scan reports and security alerts"),
              ("Application Security", "Intermediate", 0.80, "explicit", "Assists with OWASP vulnerability remediation"),
              ("DevSecOps", "Intermediate", 0.75, "project_inferred", "Configured automated dependency security checks"),
              ("Python", "Intermediate", 0.72, "explicit", "Wrote scripts to ingest security telemetry")],
             [13, 18],
             "Senior Security Engineer"),

            # 20. Hannah Schmidt - ML Engineer targeting Staff AI Platform
            ("Hannah Schmidt", "hannah.schmidt@talentgraph.internal", "AI Research", "Senior MLOps & Platform Engineer", 5.3,
             "M.S. in Computer Science, TU Munich", "AWS Machine Learning Certified, CKA",
             "ML infrastructure specialist with deep expertise in Triton inference server, Kubernetes GPU clusters, and model pipelines.",
             "High-Performance Inference, Triton, Kubernetes GPU Scheduling",
             [("MLOps", "Expert", 0.95, "explicit", "Built enterprise model registry and automated deployment pipelines"),
              ("Kubernetes", "Advanced", 0.90, "explicit", "Configured GPU node pools and auto-scaling for ML workloads"),
              ("Python", "Expert", 0.94, "explicit", "Developed inference service SDKs and feature store connectors"),
              ("PyTorch", "Advanced", 0.88, "explicit", "Optimized model quantization and ONNX runtime export"),
              ("Docker", "Advanced", 0.91, "explicit", "Built hardened GPU container images for inference"),
              ("Generative AI", "Intermediate", 0.82, "project_inferred", "Deployed LLM serving endpoints on Triton"),
              ("System Design", "Advanced", 0.86, "ai_discovered", "Architected feature store with sub-5ms lookup latency")],
             [1, 4, 9],
             "Staff AI/ML Platform Engineer"),

            # 21-30: Diverse Tenured & Junior Specialists across departments
            ("Lucas Silva", "lucas.silva@talentgraph.internal", "Engineering", "Software Engineer I", 1.5,
             "B.S. in Computer Science, Federal University of Rio", "Python Certified",
             "Junior software engineer eager to learn distributed backend systems and asynchronous Python.",
             "Python, FastAPI, Docker",
             [("Python", "Intermediate", 0.82, "explicit", "Built microservice endpoints"),
              ("PostgreSQL", "Beginner", 0.70, "explicit", "Basic SQL queries and migrations"),
              ("Docker", "Beginner", 0.65, "learning", "Learning containerization basics")],
             [0], "Senior Backend Software Engineer"),

            ("Chloe Bennett", "chloe.bennett@talentgraph.internal", "Engineering", "Frontend Engineer II", 2.9,
             "B.A. in Web Design, ArtCenter", "React Certified",
             "UI developer building sleek dashboard interfaces with Tailwind CSS and React.",
             "React, Next.js, Accessibility",
             [("React", "Advanced", 0.88, "explicit", "Developed dashboard widgets and charts"),
              ("TypeScript", "Intermediate", 0.80, "explicit", "Type definitions and components"),
              ("Tailwind CSS", "Advanced", 0.90, "explicit", "Responsive mobile layouts")],
             [8, 21], "Senior Frontend Engineer"),

            ("Gabriel Ramos", "gabriel.ramos@talentgraph.internal", "Data Platform", "Data Engineer II", 3.2,
             "B.S. in Information Management, University of Washington", "dbt Certified",
             "Data engineer focused on ETL data transformations and warehouse optimization.",
             "dbt, Snowflake, Airflow",
             [("SQL", "Advanced", 0.90, "explicit", "Wrote analytical data pipeline queries"),
              ("dbt", "Advanced", 0.86, "explicit", "Managed transformation DAGs in Snowflake"),
              ("Python", "Intermediate", 0.78, "explicit", "Airflow operator scripting")],
             [5, 17], "Senior Data Engineer"),

            ("Zoe Campbell", "zoe.campbell@talentgraph.internal", "AI Research", "AI Research Engineer", 3.5,
             "M.S. in Computational Science, Harvard University", "DeepLearning.AI Certified",
             "AI engineer researching transformer architectures, retrieval techniques, and structured outputs.",
             "Generative AI, NLP, Vector Databases",
             [("Generative AI", "Advanced", 0.90, "explicit", "Engineered prompt pipelines and agent routing"),
              ("Natural Language Processing", "Advanced", 0.88, "explicit", "Trained embedding models and semantic classifiers"),
              ("Python", "Advanced", 0.92, "explicit", "Core research code and prototyping"),
              ("PyTorch", "Intermediate", 0.82, "explicit", "Fine-tuned open-source LLM weights")],
             [1, 10], "Lead Applied AI Research Scientist"),

            ("Trevor Phillips", "trevor.phillips@talentgraph.internal", "Cloud Architecture", "Cloud Infrastructure Engineer", 3.6,
             "B.S. in Computer Networks, Arizona State", "AWS Solutions Architect Associate",
             "Cloud engineer automating serverless services, monitoring, and infrastructure provisioning.",
             "AWS, Terraform, CI/CD",
             [("Amazon Web Services (AWS)", "Advanced", 0.88, "explicit", "Configured VPCs, Lambda, and S3"),
              ("Terraform", "Intermediate", 0.82, "explicit", "Managed cloud modules via IaC"),
              ("CI/CD Pipelines", "Intermediate", 0.80, "explicit", "Automated deployment actions")],
             [3, 20], "Senior Site Reliability Engineer (SRE)"),

            ("Victoria Zhao", "victoria.zhao@talentgraph.internal", "Product", "Associate Product Manager", 2.2,
             "B.S. in Product Design, Stanford", "Agile Practitioner",
             "Junior PM conducting user interviews and mapping internal talent mobility user journeys.",
             "Product Discovery, User Research, Agile",
             [("Product Management", "Intermediate", 0.82, "explicit", "Drafted user stories and acceptance criteria"),
              ("Cross-Functional Collaboration", "Advanced", 0.86, "explicit", "Coordinated between UX and frontend teams")],
             [0], "Senior Technical Product Manager"),

            ("Samir Hassan", "samir.hassan@talentgraph.internal", "Security", "DevSecOps Engineer", 4.0,
             "B.S. in Computer Science, Cairo University", "Certified DevSecOps Professional",
             "Security engineer focused on shifting security left and automating compliance testing.",
             "DevSecOps, AppSec, Docker Security",
             [("DevSecOps", "Advanced", 0.90, "explicit", "Built automated vulnerability scanners into GitHub Actions"),
              ("Cybersecurity", "Advanced", 0.88, "explicit", "Triaged application penetration test findings"),
              ("Docker", "Advanced", 0.85, "explicit", "Hardened base images for container clusters")],
             [13, 18], "Lead DevSecOps & Security Architect"),

            ("Emily Watson", "emily.watson@talentgraph.internal", "Engineering", "Senior Backend Engineer", 4.9,
             "B.S. in Computer Science, Oxford University", "Python Institute PCAP",
             "Backend engineer with deep expertise in Python, PostgreSQL query planning, and Redis caching.",
             "PostgreSQL, Distributed Caching, Microservices",
             [("Python", "Expert", 0.94, "explicit", "Built scalable transactional backend services"),
              ("Django REST Framework", "Advanced", 0.91, "explicit", "Created high-throughput REST APIs"),
              ("PostgreSQL", "Advanced", 0.90, "explicit", "Optimized index selection and query execution plans"),
              ("Redis", "Advanced", 0.86, "explicit", "Configured caching and rate limiting queues")],
             [0, 16], "Principal Distributed Systems Architect"),

            ("Nathan Drake", "nathan.drake@talentgraph.internal", "Data Platform", "Lead Data Architect", 7.5,
             "M.S. in Computer Science, Georgia Tech", "Snowflake Architect, Spark Specialist",
             "Data architect who designs enterprise real-time streaming backbones and self-service lakehouses.",
             "Apache Kafka, Apache Spark, Snowflake, Lakehouses",
             [("Apache Kafka", "Expert", 0.96, "explicit", "Architected global enterprise event bus"),
              ("Apache Spark", "Expert", 0.95, "explicit", "Optimized multi-terabyte ETL streaming jobs"),
              ("Snowflake", "Advanced", 0.92, "explicit", "Designed data lakehouse tables"),
              ("System Design", "Advanced", 0.91, "explicit", "Designed data contracts and ingestion architecture"),
              ("SQL", "Expert", 0.96, "explicit", "Advanced analytics and dimensional modeling")],
             [2, 5, 17], "Staff Data Platform Architect"),

            ("Grace Hopper-Lee", "grace.hopperlee@talentgraph.internal", "AI Research", "Principal AI Architect", 8.8,
             "Ph.D. in Computer Science, Berkeley", "IEEE Fellow, NeurIPS Author",
             "Pioneering AI architect designing enterprise LLM reasoning systems, multimodal transformers, and agent frameworks.",
             "Agentic AI, Reasoning Architectures, Distributed Training",
             [("Generative AI", "Expert", 0.98, "explicit", "Architected company-wide LLM gateway and agent systems"),
              ("Natural Language Processing", "Expert", 0.97, "explicit", "Designed semantic retrieval and reasoning loops"),
              ("PyTorch", "Expert", 0.96, "explicit", "Distributed model training and fine-tuning"),
              ("Deep Learning", "Expert", 0.97, "explicit", "Transformer architectures and self-attention"),
              ("System Design", "Expert", 0.95, "explicit", "High-throughput GPU inference cluster design"),
              ("Technical Leadership", "Expert", 0.96, "explicit", "Leads AI research and engineering organization")],
             [1, 7, 10, 19], "Staff AI/ML Platform Engineer"),
        ]

        employee_objs = []
        for idx, (name, orig_email, dept, role_title, exp, edu, certs, bio, interests, skills, proj_indices, target_role_title) in enumerate(employees_specs):
            # Pick an avatar
            gender_slug = "women" if any(x in name.split()[0].lower() for x in ["priya", "sarah", "elena", "maya", "rachel", "aisha", "sophia", "nina", "isabella", "hannah", "chloe", "zoe", "victoria", "emily", "grace"]) else "men"
            avatar_id = random.randint(1, 90)
            avatar_url = f"https://randomuser.me/api/portraits/{gender_slug}/{avatar_id}.jpg"

            first_slug = name.split()[0].lower()
            demo_email = f"{first_slug}@novatech.demo"
            avail_pct = 0.50 if idx % 4 == 1 else (0.75 if idx % 4 == 2 else (0.0 if idx % 7 == 0 else 1.0))

            emp = Employee.objects.create(
                enterprise=novatech,
                name=name,
                email=demo_email,
                department=dept,
                current_role=role_title,
                years_experience=exp,
                education=edu,
                certifications=certs,
                bio=bio,
                interests=interests,
                avatar_url=avatar_url,
                availability_pct=avail_pct,
                current_allocation_pct=round(1.0 - avail_pct, 2)
            )

            # Create User and UserProfile for employee
            user_uname = f"{first_slug}_{idx+1}" if User.objects.filter(username=first_slug).exists() else first_slug
            emp_user = User.objects.create_user(
                username=user_uname,
                email=demo_email,
                password="password123",
                first_name=name.split()[0],
                last_name=" ".join(name.split()[1:]) if len(name.split()) > 1 else ''
            )
            UserProfile.objects.create(
                user=emp_user,
                enterprise=novatech,
                role='employee',
                employee=emp,
                title=role_title,
                is_temporary_password=False
            )

            # Generate and cache employee embedding
            emp_text = build_employee_text_context(emp)
            emp.embedding = get_text_embedding(emp_text)
            emp.save(update_fields=['embedding'])
            employee_objs.append(emp)

            # Assign skills
            for sname, prof, conf, src, evid in skills:
                if sname in skill_objs:
                    v_status = 'hr_verified' if src in ['explicit', 'learning'] else 'self_reported'
                    EmployeeSkill.objects.create(
                        employee=emp,
                        skill=skill_objs[sname],
                        proficiency=prof,
                        confidence=conf,
                        source=src,
                        evidence=evid,
                        verification_status=v_status,
                        verified_by=hr_user if v_status == 'hr_verified' else None,
                        verified_at=timezone.now() if v_status == 'hr_verified' else None,
                        last_demonstrated_date=timezone.now().date()
                    )

            # Assign project contributions
            for p_idx in proj_indices:
                if p_idx < len(project_objs):
                    p_obj = project_objs[p_idx]
                    ProjectContribution.objects.create(
                        employee=emp,
                        project=p_obj,
                        role_in_project=f"Lead Developer / Specialist" if exp >= 4 else "Core Contributor",
                        contribution_summary=f"Designed and delivered core modules in {p_obj.name}, contributing directly to key technical milestones.",
                        evidence=f"Validated technical impact and verified outcomes in production release of {p_obj.name}.",
                        allocation_pct=0.25 if avail_pct < 1.0 else 0.5,
                        verification_status='approved',
                        verified_by=hr_user,
                        verified_at=timezone.now()
                    )

            # Assign career goal
            target_role_obj = Role.objects.filter(title=target_role_title, enterprise=novatech).first()
            CareerGoal.objects.create(
                employee=emp,
                target_role_title=target_role_title,
                target_role_id=target_role_obj.id if target_role_obj else None,
                notes=f"Targeting internal progression to {target_role_title} within the next 12-18 months."
            )

            # Assign random 1-3 learning courses
            assigned_courses = random.sample(list(LearningResource.objects.filter(enterprise=novatech)), k=random.randint(1, 3))
            for i, course in enumerate(assigned_courses):
                status_choice = "Completed" if i == 0 else random.choice(["In Progress", "Completed"])
                EmployeeLearning.objects.create(
                    employee=emp,
                    resource=course,
                    status=status_choice,
                    completion_date=timezone.now().date() if status_choice == "Completed" else None,
                    outcome="Passed with distinction and completed final capstone" if status_choice == "Completed" else "Module 3 of 5 in progress"
                )

        self.stdout.write("6. Calculating Initial Role Matches across all employees...")
        for emp in employee_objs:
            for role in role_objs:
                calculate_role_match(emp, role, force_refresh=True)

        self.stdout.write("7. Seeding Enterprise Staffing Requests, Approvals & Audit Trail...")
        # 1. Staffing Request
        staffing_req = StaffingRequest.objects.create(
            enterprise=novatech,
            project=project_objs[1], # Enterprise Generative AI Assistant
            project_title="AI Demand Forecasting & Agentic Workflow Platform",
            department="AI Research",
            requested_by=hr_user,
            team_size=4,
            required_skills=[
                {"name": "Python", "min_proficiency": "Advanced", "importance": "Essential"},
                {"name": "Machine Learning", "min_proficiency": "Advanced", "importance": "Essential"},
                {"name": "Generative AI", "min_proficiency": "Intermediate", "importance": "Essential"},
                {"name": "MLOps", "min_proficiency": "Intermediate", "importance": "Preferred"},
            ],
            minimum_experience=3.0,
            duration_months=6,
            description="Build autonomous forecasting agent and fine-tune foundation models."
        )

        from apps.projects.staffing_service import StaffingEngine
        recs = StaffingEngine.rank_candidates_for_enterprise(
            enterprise=novatech,
            required_skills=staffing_req.required_skills,
            minimum_experience=staffing_req.minimum_experience,
            project_description=staffing_req.description,
            limit=5
        )
        for cand in recs:
            cand_emp = Employee.objects.get(id=cand['employee_id'])
            expl = StaffingEngine.generate_candidate_explanation(
                candidate_score=cand,
                project_title=staffing_req.project_title,
                project_description=staffing_req.description,
                ai_processing_mode='AI_SAFE_SUMMARY'
            )
            StaffingRecommendation.objects.create(
                staffing_request=staffing_req,
                employee=cand_emp,
                overall_score=cand['overall_score'],
                skill_score=cand['skill_score'],
                experience_score=cand['experience_score'],
                project_score=cand['project_score'],
                evidence_score=cand['evidence_score'],
                freshness_score=cand['freshness_score'],
                availability_score=cand['availability_score'],
                matched_skills=cand['matched_skills'],
                missing_skills=cand['missing_skills'],
                explanation=expl,
                rank=cand['rank'],
                status='Recommended'
            )

        # 2. Pending Approval Request
        maya_user = User.objects.filter(email='maya@novatech.demo').first() or hr_user
        ApprovalRequest.objects.create(
            enterprise=novatech,
            requester=maya_user,
            request_type='project_contribution',
            title="Maya Lin submitted contribution for Real-Time Financial Fraud Detection Engine",
            description="Role: Lead ML Scientist\nSummary: Designed custom GNN architectures for real-time risk scoring.\nEvidence: Validated model with 99.1% precision in staging cluster.",
            payload={
                'employee_id': employee_objs[1].id,
                'project_id': project_objs[7].id,
                'technologies': "PyTorch, Machine Learning, Python"
            },
            status='pending'
        )

        # 3. Seed initial audit log entries
        AuditLog.objects.create(
            enterprise=novatech,
            actor=hr_user,
            actor_name="Sarah Vance",
            action="ENTERPRISE_INITIALIZED",
            target_model="Enterprise",
            target_id=str(novatech.id),
            details={"roles_seeded": len(role_objs), "employees_seeded": len(employee_objs)}
        )
        AuditLog.objects.create(
            enterprise=novatech,
            actor=hr_user,
            actor_name="Sarah Vance",
            action="STAFFING_REQUEST_CREATED",
            target_model="StaffingRequest",
            target_id=str(staffing_req.id),
            details={"project_title": staffing_req.project_title, "team_size": staffing_req.team_size}
        )

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded TalentGraph AI Multi-Tenant Enterprise:\n"
            f"  - Enterprise: {novatech.name} ({novatech.industry})\n"
            f"  - 1 HR Admin Account: hr@novatech.demo (password: password123)\n"
            f"  - {Employee.objects.count()} Employee Accounts (alex@novatech.demo, maya@novatech.demo, etc.)\n"
            f"  - {Skill.objects.count()} Skills\n"
            f"  - {LearningResource.objects.count()} Learning Resources\n"
            f"  - {Project.objects.count()} Projects\n"
            f"  - {Role.objects.count()} Roles\n"
            f"  - {EmployeeSkill.objects.count()} Employee Skills\n"
            f"  - {ProjectContribution.objects.count()} Project Contributions\n"
            f"  - {StaffingRequest.objects.count()} Staffing Requests\n"
            f"  - {ApprovalRequest.objects.count()} Pending Approvals\n"
            f"  - {AuditLog.objects.count()} Audit Log Entries"
        ))
