"""
Question Pattern Analyzer & Predictor
Predicts next interview questions based on conversation context
"""

import re
from typing import List, Dict, Tuple


class QuestionPredictor:
    """Predicts likely next questions based on job requirements and conversation flow"""

    def __init__(self, job_description: str = ""):
        self.question_graph = self._build_question_graph()
        self.current_topic = None
        self.question_history = []
        self.job_description = job_description
        self.job_requirements = self._extract_job_requirements(job_description) if job_description else []
        self.covered_requirements = set()  # Track which requirements have been discussed

    def _extract_job_requirements(self, job_desc: str) -> List[Dict[str, any]]:
        """
        Extract technical requirements and skills from job description.
        Returns a list of requirements with associated question templates.
        """
        if not job_desc:
            return []

        requirements = []
        job_lower = job_desc.lower()

        # Comprehensive technical skills mapping
        skills_map = {
            'python': {
                'skill': 'Python',
                'questions': [
                    "Can you describe your experience with Python?",
                    "What Python libraries have you worked with?",
                    "How would you optimize Python code for performance?"
                ],
                'keywords': ['python', 'pandas', 'numpy', 'django', 'flask', 'pyspark']
            },
            'sql': {
                'skill': 'SQL',
                'questions': [
                    "What's your experience with SQL?",
                    "Can you write a complex SQL query to solve this problem?",
                    "How do you optimize slow SQL queries?"
                ],
                'keywords': ['sql', 'mysql', 'postgresql', 'oracle', 'sql server', 'query']
            },
            'etl': {
                'skill': 'ETL',
                'questions': [
                    "Describe an ETL pipeline you've built",
                    "How do you handle ETL failures and retries?",
                    "What tools do you use for ETL development?"
                ],
                'keywords': ['etl', 'data pipeline', 'data integration', 'extract transform load']
            },
            'spark': {
                'skill': 'Apache Spark',
                'questions': [
                    "What's your experience with Apache Spark?",
                    "How do you optimize Spark jobs?",
                    "Explain Spark's execution model"
                ],
                'keywords': ['spark', 'pyspark', 'apache spark', 'rdd', 'dataframe']
            },
            'airflow': {
                'skill': 'Apache Airflow',
                'questions': [
                    "How do you structure Airflow DAGs?",
                    "Describe your experience with Airflow",
                    "How do you handle task dependencies in Airflow?"
                ],
                'keywords': ['airflow', 'apache airflow', 'dag', 'workflow orchestration']
            },
            'aws': {
                'skill': 'AWS',
                'questions': [
                    "Which AWS services have you used?",
                    "How do you architect data solutions on AWS?",
                    "Describe your experience with AWS data services"
                ],
                'keywords': ['aws', 's3', 'redshift', 'glue', 'lambda', 'ec2', 'emr']
            },
            'azure': {
                'skill': 'Azure',
                'questions': [
                    "What Azure services have you worked with?",
                    "Describe your experience with Azure data platform",
                    "How do you implement data solutions on Azure?"
                ],
                'keywords': ['azure', 'azure synapse', 'data factory', 'azure sql']
            },
            'gcp': {
                'skill': 'Google Cloud Platform',
                'questions': [
                    "What GCP services have you used?",
                    "Describe your experience with GCP data tools",
                    "How do you build data pipelines on GCP?"
                ],
                'keywords': ['gcp', 'google cloud', 'bigquery', 'dataflow', 'cloud composer']
            },
            'databricks': {
                'skill': 'Databricks',
                'questions': [
                    "What's your experience with Databricks?",
                    "How do you use Databricks for data engineering?",
                    "Describe a Databricks project you've worked on"
                ],
                'keywords': ['databricks', 'delta lake', 'databricks sql']
            },
            'kafka': {
                'skill': 'Kafka',
                'questions': [
                    "Describe your experience with Kafka",
                    "How do you handle streaming data with Kafka?",
                    "What's your approach to Kafka monitoring?"
                ],
                'keywords': ['kafka', 'streaming', 'event streaming', 'message queue']
            },
            'docker': {
                'skill': 'Docker',
                'questions': [
                    "How do you use Docker in data engineering?",
                    "Describe your experience with containerization",
                    "How do you optimize Docker images?"
                ],
                'keywords': ['docker', 'container', 'containerization']
            },
            'kubernetes': {
                'skill': 'Kubernetes',
                'questions': [
                    "What's your experience with Kubernetes?",
                    "How do you deploy data applications on K8s?",
                    "Describe a Kubernetes architecture you've implemented"
                ],
                'keywords': ['kubernetes', 'k8s', 'orchestration']
            },
            'data_warehouse': {
                'skill': 'Data Warehousing',
                'questions': [
                    "What's your experience with data warehousing?",
                    "How do you design a data warehouse?",
                    "Describe dimensional modeling approaches you've used"
                ],
                'keywords': ['data warehouse', 'data warehousing', 'dimensional modeling', 'star schema']
            },
            'machine_learning': {
                'skill': 'Machine Learning',
                'questions': [
                    "What ML models have you built?",
                    "How do you approach feature engineering?",
                    "Describe your ML deployment experience"
                ],
                'keywords': ['machine learning', 'ml', 'model', 'scikit-learn', 'tensorflow', 'pytorch']
            },
            'power_bi': {
                'skill': 'Power BI',
                'questions': [
                    "What's your experience with Power BI?",
                    "How do you design effective dashboards?",
                    "Describe a Power BI project you've delivered"
                ],
                'keywords': ['power bi', 'powerbi', 'dax', 'power query']
            },
            'tableau': {
                'skill': 'Tableau',
                'questions': [
                    "Describe your experience with Tableau",
                    "How do you optimize Tableau dashboards?",
                    "What visualization best practices do you follow?"
                ],
                'keywords': ['tableau', 'data visualization']
            },
            'dbt': {
                'skill': 'dbt',
                'questions': [
                    "What's your experience with dbt?",
                    "How do you structure dbt projects?",
                    "Describe your dbt testing strategy"
                ],
                'keywords': ['dbt', 'data build tool', 'transformation']
            }
        }

        # Check which skills are mentioned in the job description
        for key, skill_info in skills_map.items():
            # Check if any keyword is in the job description
            if any(keyword in job_lower for keyword in skill_info['keywords']):
                requirements.append({
                    'skill': skill_info['skill'],
                    'questions': skill_info['questions'],
                    'priority': 'high' if key in ['python', 'sql', 'etl'] else 'normal'
                })

        print(f"[PREDICTOR] Extracted {len(requirements)} requirements from job description:")
        for req in requirements:
            print(f"  - {req['skill']} ({req['priority']} priority)")

        return requirements

    def _build_question_graph(self) -> Dict:
        """
        Build a graph of typical interview question patterns.
        Maps topics to related questions and follow-up patterns.
        """
        return {
            # Data Engineering topics
            'etl': {
                'follow_ups': [
                    "Can you describe a specific ETL pipeline you've built?",
                    "How do you handle errors and failures in ETL processes?",
                    "What tools do you prefer for ETL and why?"
                ],
                'related_topics': ['data_quality', 'pipeline', 'airflow']
            },
            'data_quality': {
                'follow_ups': [
                    "How do you ensure data quality in your pipelines?",
                    "Can you describe a time when you caught a data quality issue?",
                    "What metrics do you use to monitor data quality?"
                ],
                'related_topics': ['testing', 'validation', 'monitoring']
            },
            'pipeline': {
                'follow_ups': [
                    "How do you handle pipeline failures and retries?",
                    "What's your approach to pipeline monitoring?",
                    "How do you optimize pipeline performance?"
                ],
                'related_topics': ['airflow', 'orchestration', 'scalability']
            },
            'airflow': {
                'follow_ups': [
                    "How do you structure your Airflow DAGs?",
                    "What challenges have you faced with Airflow?",
                    "How do you handle dependencies between tasks?"
                ],
                'related_topics': ['orchestration', 'scheduling', 'pipeline']
            },
            'spark': {
                'follow_ups': [
                    "Can you explain how Spark's distributed processing works?",
                    "How do you optimize Spark jobs for performance?",
                    "What challenges have you faced with Spark?"
                ],
                'related_topics': ['big_data', 'distributed_systems', 'performance']
            },
            'sql': {
                'follow_ups': [
                    "Can you write a query to solve this problem?",
                    "How would you optimize a slow-running query?",
                    "What's the difference between JOIN types?"
                ],
                'related_topics': ['database', 'optimization', 'indexing']
            },
            'python': {
                'follow_ups': [
                    "Can you explain decorators in Python?",
                    "How does Python's memory management work?",
                    "What's the difference between list and tuple?"
                ],
                'related_topics': ['programming', 'data_structures', 'algorithms']
            },
            'machine_learning': {
                'follow_ups': [
                    "How do you handle overfitting in ML models?",
                    "Can you explain the bias-variance tradeoff?",
                    "What metrics do you use to evaluate model performance?"
                ],
                'related_topics': ['modeling', 'evaluation', 'deployment']
            },
            'aws': {
                'follow_ups': [
                    "Which AWS services have you used for data pipelines?",
                    "How do you manage costs in AWS?",
                    "Can you explain the difference between S3 storage classes?"
                ],
                'related_topics': ['cloud', 'infrastructure', 's3']
            },
            'docker': {
                'follow_ups': [
                    "How do you use Docker in data engineering?",
                    "What's the difference between Docker and Kubernetes?",
                    "How do you optimize Docker images?"
                ],
                'related_topics': ['containers', 'deployment', 'devops']
            },
            # Behavioral topics
            'challenge': {
                'follow_ups': [
                    "What did you learn from that experience?",
                    "How did you resolve the issue?",
                    "What would you do differently next time?"
                ],
                'related_topics': ['teamwork', 'problem_solving']
            },
            'teamwork': {
                'follow_ups': [
                    "How do you handle disagreements with team members?",
                    "Can you describe your ideal team structure?",
                    "How do you mentor junior engineers?"
                ],
                'related_topics': ['leadership', 'communication']
            },
            'project': {
                'follow_ups': [
                    "What was the most challenging part of that project?",
                    "What was the impact of that project?",
                    "What technologies did you use and why?"
                ],
                'related_topics': ['technical_details', 'impact', 'decisions']
            }
        }

    def extract_topic(self, question: str) -> str:
        """Extract the main topic from a question"""
        question_lower = question.lower()

        # Keywords for topic detection
        topic_keywords = {
            'etl': ['etl', 'extract', 'transform', 'load'],
            'data_quality': ['data quality', 'validation', 'data integrity', 'accuracy'],
            'pipeline': ['pipeline', 'workflow', 'data flow'],
            'airflow': ['airflow', 'dag', 'orchestration'],
            'spark': ['spark', 'pyspark', 'rdd', 'dataframe'],
            'sql': ['sql', 'query', 'select', 'join', 'database'],
            'python': ['python', 'lambda', 'decorator', 'list comprehension'],
            'machine_learning': ['machine learning', 'ml', 'model', 'prediction', 'training'],
            'aws': ['aws', 's3', 'ec2', 'lambda', 'glue', 'redshift'],
            'docker': ['docker', 'container', 'dockerfile'],
            'challenge': ['challenge', 'difficult', 'problem', 'issue', 'overcome'],
            'teamwork': ['team', 'collaboration', 'work with', 'communicate'],
            'project': ['project', 'built', 'developed', 'implemented']
        }

        # Find matching topic
        for topic, keywords in topic_keywords.items():
            for keyword in keywords:
                if keyword in question_lower:
                    return topic

        return 'general'

    def analyze_depth(self, answer: str) -> float:
        """
        Analyze the depth of an answer (0.0 to 1.0)
        Higher score = more detailed answer
        """
        if not answer:
            return 0.0

        depth_score = 0.0

        # Length factor (longer = more detailed)
        word_count = len(answer.split())
        length_score = min(word_count / 200, 1.0)  # Max score at 200 words
        depth_score += length_score * 0.3

        # Technical terms factor
        technical_terms = [
            'architecture', 'optimization', 'performance', 'scalability',
            'implementation', 'algorithm', 'framework', 'infrastructure',
            'distributed', 'parallel', 'concurrent', 'asynchronous'
        ]
        term_count = sum(1 for term in technical_terms if term in answer.lower())
        term_score = min(term_count / 5, 1.0)
        depth_score += term_score * 0.3

        # Example/experience factor (mentions of specific projects)
        experience_indicators = ['i built', 'i used', 'i implemented', 'i developed', 'in my project']
        has_experience = any(ind in answer.lower() for ind in experience_indicators)
        if has_experience:
            depth_score += 0.2

        # Metrics/numbers factor (specific data)
        has_metrics = bool(re.search(r'\d+%|\d+ (ms|seconds|minutes|gb|tb|records)', answer.lower()))
        if has_metrics:
            depth_score += 0.2

        return min(depth_score, 1.0)

    def get_deeper_questions(self, topic: str) -> List[str]:
        """Get follow-up questions that dig deeper into the same topic"""
        if topic in self.question_graph:
            return self.question_graph[topic]['follow_ups']

        # Generic follow-ups if topic not found
        return [
            "Can you provide a specific example from your experience?",
            "What challenges did you face and how did you overcome them?",
            "How would you approach this differently with hindsight?"
        ]

    def get_related_topics(self, topic: str) -> List[str]:
        """Get questions from related topics"""
        if topic not in self.question_graph:
            return []

        related = self.question_graph[topic].get('related_topics', [])
        questions = []

        for related_topic in related:
            if related_topic in self.question_graph:
                # Get first question from related topic
                follow_ups = self.question_graph[related_topic]['follow_ups']
                if follow_ups:
                    questions.append(follow_ups[0])

        return questions

    def translate_question(self, question: str, target_language: str) -> str:
        """
        Translate question to target language using keyword replacement.
        Supports: English, Portuguese, French
        """
        if target_language == 'English':
            return question  # Questions are already in English

        # Translation mappings
        translations = {
            'Portuguese': {
                # Common question starters
                'Can you describe': 'Pode descrever',
                'What\'s your experience with': 'Qual é sua experiência com',
                'How do you': 'Como você',
                'Describe your experience with': 'Descreva sua experiência com',
                'What': 'Qual',
                'How would you': 'Como você',
                'Explain': 'Explique',
                'Can you write': 'Você pode escrever',
                'What challenges have you faced': 'Quais desafios você enfrentou',
                'Which': 'Quais',
                'How did you': 'Como você',
                'What did you learn': 'O que você aprendeu',
                'What would you do': 'O que você faria',

                # Technical terms
                'experience': 'experiência',
                'pipeline': 'pipeline',
                'data': 'dados',
                'database': 'banco de dados',
                'query': 'consulta',
                'performance': 'desempenho',
                'optimization': 'otimização',
                'project': 'projeto',
                'team': 'equipe',
                'challenge': 'desafio',
                'problem': 'problema',
                'solution': 'solução',
                'tools': 'ferramentas',
                'services': 'serviços',
                'model': 'modelo',
                'code': 'código',
                'testing': 'testes',
                'deployment': 'implantação',
                'architecture': 'arquitetura',

                # Reason phrases
                'Digging deeper into your answer': 'Aprofundando em sua resposta',
                'Moving to related topic': 'Movendo para tópico relacionado',
                'Possible deeper dive': 'Possível aprofundamento',
                'Required skill': 'Habilidade necessária',
                'Job requirement': 'Requisito da vaga',
                'Deeper dive': 'Aprofundamento'
            },
            'French': {
                # Common question starters
                'Can you describe': 'Pouvez-vous décrire',
                'What\'s your experience with': 'Quelle est votre expérience avec',
                'How do you': 'Comment',
                'Describe your experience with': 'Décrivez votre expérience avec',
                'What': 'Quel',
                'How would you': 'Comment',
                'Explain': 'Expliquez',
                'Can you write': 'Pouvez-vous écrire',
                'What challenges have you faced': 'Quels défis avez-vous rencontrés',
                'Which': 'Quels',
                'How did you': 'Comment avez-vous',
                'What did you learn': 'Qu\'avez-vous appris',
                'What would you do': 'Que feriez-vous',

                # Technical terms
                'experience': 'expérience',
                'pipeline': 'pipeline',
                'data': 'données',
                'database': 'base de données',
                'query': 'requête',
                'performance': 'performance',
                'optimization': 'optimisation',
                'project': 'projet',
                'team': 'équipe',
                'challenge': 'défi',
                'problem': 'problème',
                'solution': 'solution',
                'tools': 'outils',
                'services': 'services',
                'model': 'modèle',
                'code': 'code',
                'testing': 'tests',
                'deployment': 'déploiement',
                'architecture': 'architecture',

                # Reason phrases
                'Digging deeper into your answer': 'Approfondissement de votre réponse',
                'Moving to related topic': 'Passage au sujet connexe',
                'Possible deeper dive': 'Approfondissement possible',
                'Required skill': 'Compétence requise',
                'Job requirement': 'Exigence du poste',
                'Deeper dive': 'Approfondissement'
            }
        }

        if target_language not in translations:
            return question

        translated = question
        for english, target in translations[target_language].items():
            # Case-insensitive replacement, preserving case
            import re
            pattern = re.compile(re.escape(english), re.IGNORECASE)
            translated = pattern.sub(target, translated)

        return translated

    def predict_next_questions(
        self,
        current_question: str,
        your_answer: str,
        language: str = 'English'
    ) -> List[Dict[str, any]]:
        """
        Predict the next 3 most likely questions based on job requirements

        Args:
            current_question: The question that was just asked
            your_answer: The answer that was given
            language: Target language for predictions ('English', 'Portuguese', 'French')

        Returns:
            List of predictions with confidence scores
        """
        # Extract topic from current question
        topic = self.extract_topic(current_question)
        self.current_topic = topic
        self.question_history.append({
            'question': current_question,
            'topic': topic
        })

        # Mark current topic as covered
        if topic != 'general':
            self.covered_requirements.add(topic)

        # Analyze answer depth
        depth_level = self.analyze_depth(your_answer)

        predictions = []

        # PRIORITY 1: Use job requirements if available
        if self.job_requirements:
            predictions = self._predict_from_job_requirements(topic, depth_level, current_question, your_answer, language)

            # If we got predictions from job requirements, return them
            if predictions:
                print(f"[PREDICTOR] Generated {len(predictions)} predictions from job requirements in {language}")
                return predictions[:3]

        # FALLBACK: Use generic question graph if no job requirements
        print(f"[PREDICTOR] Using fallback generic predictions in {language}")

        if depth_level < 0.6:
            # Answer was superficial → expect follow-up questions on same topic
            follow_ups = self.get_deeper_questions(topic)
            for i, question in enumerate(follow_ups):
                translated_question = self.translate_question(question, language)
                translated_reason = self.translate_question('Digging deeper into your answer', language)
                predictions.append({
                    'question': translated_question,
                    'confidence': 0.85 - (i * 0.1),  # Decreasing confidence
                    'type': 'follow_up',
                    'reason': translated_reason
                })
        else:
            # Answer was detailed → likely to move to related topic
            related = self.get_related_topics(topic)
            for i, question in enumerate(related):
                translated_question = self.translate_question(question, language)
                translated_reason = self.translate_question('Moving to related topic', language)
                predictions.append({
                    'question': translated_question,
                    'confidence': 0.75 - (i * 0.1),
                    'type': 'related',
                    'reason': translated_reason
                })

            # Also add some follow-ups (lower confidence)
            follow_ups = self.get_deeper_questions(topic)
            if follow_ups and len(predictions) < 3:
                translated_question = self.translate_question(follow_ups[0], language)
                translated_reason = self.translate_question('Possible deeper dive', language)
                predictions.append({
                    'question': translated_question,
                    'confidence': 0.60,
                    'type': 'follow_up',
                    'reason': translated_reason
                })

        # Return top 3 predictions
        return predictions[:3]

    def _predict_from_job_requirements(
        self,
        current_topic: str,
        depth_level: float,
        current_question: str,
        your_answer: str,
        language: str = 'English'
    ) -> List[Dict[str, any]]:
        """
        Generate predictions based on job requirements.
        Prioritizes uncovered requirements and relevant follow-ups.
        Translates questions to target language.
        """
        predictions = []

        # Find which requirement the current question relates to
        current_requirement = None
        for req in self.job_requirements:
            skill_lower = req['skill'].lower()
            if skill_lower in current_question.lower() or skill_lower in your_answer.lower():
                current_requirement = req
                break

        if depth_level < 0.6 and current_requirement:
            # Answer was superficial - ask follow-up questions on same requirement
            remaining_questions = [q for q in current_requirement['questions'] if q != current_question]

            for i, question in enumerate(remaining_questions[:3]):
                translated_question = self.translate_question(question, language)
                predictions.append({
                    'question': translated_question,
                    'confidence': 0.90 - (i * 0.05),
                    'type': 'follow_up',
                    'reason': f"Required skill: {current_requirement['skill']}"
                })

        else:
            # Answer was detailed - move to next uncovered requirement
            # Get uncovered requirements (not yet discussed)
            uncovered = []
            for req in self.job_requirements:
                skill_key = req['skill'].lower().replace(' ', '_')
                if skill_key not in self.covered_requirements:
                    uncovered.append(req)

            # Prioritize high-priority requirements
            uncovered_high_priority = [r for r in uncovered if r['priority'] == 'high']
            uncovered_normal = [r for r in uncovered if r['priority'] == 'normal']

            # Combine: high priority first, then normal
            prioritized_requirements = uncovered_high_priority + uncovered_normal

            # Generate predictions from uncovered requirements
            for i, req in enumerate(prioritized_requirements[:3]):
                confidence = 0.88 - (i * 0.08)

                # Pick first question from requirement
                if req['questions']:
                    translated_question = self.translate_question(req['questions'][0], language)
                    predictions.append({
                        'question': translated_question,
                        'confidence': confidence,
                        'type': 'related',
                        'reason': f"Job requirement: {req['skill']}"
                    })

            # If we have less than 3 predictions, add follow-ups from current requirement
            if len(predictions) < 3 and current_requirement:
                remaining_questions = [q for q in current_requirement['questions'] if q != current_question]
                for question in remaining_questions[:3 - len(predictions)]:
                    translated_question = self.translate_question(question, language)
                    predictions.append({
                        'question': translated_question,
                        'confidence': 0.75,
                        'type': 'follow_up',
                        'reason': f"Deeper dive: {current_requirement['skill']}"
                    })

        return predictions

    def add_custom_pattern(self, topic: str, follow_ups: List[str], related: List[str]):
        """Allow adding custom question patterns"""
        self.question_graph[topic] = {
            'follow_ups': follow_ups,
            'related_topics': related
        }
