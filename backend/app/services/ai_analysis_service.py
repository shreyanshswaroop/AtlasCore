import json

from openai import OpenAI

from app.core.config import get_settings
from app.models.paper import Paper
from app.schemas.paper_ai_analysis import PaperAnalysisOutput


settings = get_settings()

client = OpenAI(
    api_key=settings.openrouter_api_key,
    base_url="https://openrouter.ai/api/v1",
)


SYSTEM_PROMPT = """
You are an AI research analyst for AtlasCore.

Analyze academic research papers accurately and conservatively.

Rules:
- Base your analysis only on the supplied title and abstract.
- Do not invent benchmark numbers, datasets, results, implementations,
  limitations, or claims that are not supported by the supplied text.
- Use clear language suitable for engineers and technical readers.
- Keep list items concise and specific.
- If the abstract does not state a limitation directly, infer only a
  reasonable limitation and phrase it cautiously.
- Difficulty must be Beginner, Intermediate, Advanced, or Research.
- Return only valid JSON matching the supplied schema.
- Do not include Markdown.
- Do not wrap the response in ```json code fences.
"""


def generate_paper_analysis(
    paper: Paper,
) -> PaperAnalysisOutput:
    paper_input = f"""
Paper title:
{paper.title}

Authors:
{", ".join(paper.authors)}

Categories:
{", ".join(paper.categories)}

Abstract:
{paper.abstract}
"""

    schema = PaperAnalysisOutput.model_json_schema()
    schema_instructions = (
        f"{SYSTEM_PROMPT}\n\n"
        "Return exactly the properties defined by this JSON schema. "
        "Do not add title, authors, methodology, or results fields.\n"
        f"{json.dumps(schema, indent=2)}"
    )

    response = client.chat.completions.create(
        model=settings.openrouter_model,
        messages=[
            {
                "role": "system",
                "content": schema_instructions,
            },
            {
                "role": "user",
                "content": paper_input,
            },
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "paper_analysis",
                "strict": True,
                "schema": schema,
            },
        },
        temperature=0.2,
        extra_body={
            "provider": {
                "require_parameters": True,
            },
        },
    )

    content = response.choices[0].message.content

    if not content:
        raise RuntimeError(
            "The model returned an empty paper analysis."
        )

    try:
        data = json.loads(content)
        return PaperAnalysisOutput.model_validate(data)
    except (json.JSONDecodeError, ValueError) as error:
        raise RuntimeError(
            f"The model returned invalid structured output: {content}"
        ) from error
