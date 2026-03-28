"""
AI Service for Denial Analysis and Vector Similarity Search
Uses OpenAI GPT-4o-mini for denial analysis and embeddings for precedent matching
"""

import openai
import numpy as np
from typing import List, Dict, Any


class AIService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        openai.api_key = api_key

    async def analyze_denial(self, denial_text: str, denial_code: str) -> Dict[str, Any]:
        """
        Use GPT-4o-mini to analyze denial reason and extract structured data
        """
        try:
            response = openai.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {
                        'role': 'system',
                        'content': '''You are an expert healthcare attorney analyzing insurance denials under MHPAEA.
                        Extract structured information from the denial text. Return JSON with:
                        - category: denial category (Medical Necessity, Documentation, Prior Authorization, etc.)
                        - code: MHPAEA code (e.g., MN, DR, PA)
                        - regulation: specific CFR or statute citation
                        - parityImplication: how this violates parity
                        - severity: high/medium/low
                        - keyPhrases: array of important phrases from denial text'''
                    },
                    {
                        'role': 'user',
                        'content': f'Denial Code: {denial_code}\nDenial Text: {denial_text}'
                    }
                ],
                response_format={'type': 'json_object'},
                temperature=0.1,
                max_tokens=500
            )

            import json
            return json.loads(response.choices[0].message.content)

        except Exception as e:
            print(f"Denial analysis error: {str(e)}")
            # Fallback to rule-based classification
            return self._fallback_classification(denial_text, denial_code)

    def _fallback_classification(self, denial_text: str, denial_code: str) -> Dict[str, Any]:
        """Rule-based fallback if API fails"""
        lower = denial_text.lower()

        if 'medical necessity' in lower or 'not medically necessary' in lower:
            return {
                'category': 'Medical Necessity',
                'code': 'MN',
                'regulation': 'MHPAEA § 712(c)(3)',
                'parityImplication': 'Medical necessity criteria for MH must be comparable to M/S',
                'severity': 'high',
                'keyPhrases': ['medical necessity', 'not medically necessary']
            }
        elif 'documentation' in lower or 'insufficient' in lower:
            return {
                'category': 'Documentation Requirement',
                'code': 'DR',
                'regulation': '29 CFR § 2590.712(c)(4)(ii)',
                'parityImplication': 'Documentation requirements cannot be more stringent for MH/SUD',
                'severity': 'high',
                'keyPhrases': ['documentation', 'insufficient']
            }
        else:
            return {
                'category': 'General Denial',
                'code': 'GD',
                'regulation': 'MHPAEA § 712',
                'parityImplication': 'All MH/SUD coverage must meet parity with M/S coverage',
                'severity': 'medium',
                'keyPhrases': []
            }

    async def get_embedding(self, text: str) -> List[float]:
        """Get OpenAI embedding for text"""
        try:
            response = openai.embeddings.create(
                model='text-embedding-3-small',
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Embedding error: {str(e)}")
            return []

    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        if not vec1 or not vec2:
            return 0.0

        vec1 = np.array(vec1)
        vec2 = np.array(vec2)

        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return float(dot_product / (norm1 * norm2))

    async def find_similar_precedents(
        self,
        denial_text: str,
        precedents: List[Dict[str, Any]],
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Find most relevant precedents using vector similarity
        """
        try:
            # Get embedding for denial text
            denial_embedding = await self.get_embedding(denial_text)

            if not denial_embedding:
                return precedents[:top_k]  # Fallback to first k

            # Get embeddings for precedents (combine case + relevance for better matching)
            precedent_embeddings = []
            for p in precedents:
                text = f"{p['case']} {p['relevance']}"
                emb = await self.get_embedding(text)
                precedent_embeddings.append(emb)

            # Calculate similarities
            similarities = []
            for i, p_emb in enumerate(precedent_embeddings):
                sim = self.cosine_similarity(denial_embedding, p_emb)
                similarities.append((i, sim))

            # Sort by similarity and return top k
            similarities.sort(key=lambda x: x[1], reverse=True)
            top_indices = [idx for idx, _ in similarities[:top_k]]

            return [
                {**precedents[i], 'similarity': similarities[j][1]}
                for j, i in enumerate(top_indices)
            ]

        except Exception as e:
            print(f"Precedent matching error: {str(e)}")
            return precedents[:top_k]  # Fallback

    async def enhance_appeal_letter(
        self,
        appeal_text: str,
        patient_context: Dict[str, Any]
    ) -> str:
        """
        Optionally enhance appeal letter with AI suggestions
        """
        try:
            response = openai.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {
                        'role': 'system',
                        'content': '''You are a healthcare attorney reviewing an insurance appeal letter.
                        Enhance the letter by:
                        1. Strengthening legal language
                        2. Adding specific CFR citations where missing
                        3. Emphasizing MHPAEA violations more clearly
                        4. Ensuring professional tone throughout
                        Keep the core content intact, only enhance clarity and legal precision.'''
                    },
                    {
                        'role': 'user',
                        'content': appeal_text
                    }
                ],
                temperature=0.3,
                max_tokens=2500
            )

            return response.choices[0].message.content

        except Exception as e:
            print(f"Appeal enhancement error: {str(e)}")
            return appeal_text  # Return original if enhancement fails
