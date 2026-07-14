from dataclasses import dataclass


@dataclass(frozen=True)
class TopicDefinition:
    label: str
    aliases: tuple[str, ...]


TOPIC_DEFINITIONS: tuple[TopicDefinition, ...] = (
    TopicDefinition(
        label="AGENTS",
        aliases=("agent", "multi-agent", "autonomous agent", "tool use"),
    ),
    TopicDefinition(
        label="API",
        aliases=("API", "tool calling", "function calling", "interface"),
    ),
    TopicDefinition(
        label="AUDIO",
        aliases=("audio", "speech", "voice", "music", "speaker", "sound"),
    ),
    TopicDefinition(
        label="BENCHMARKS",
        aliases=("benchmark", "evaluation", "leaderboard", "eval", "assessment"),
    ),
    TopicDefinition(
        label="BUSINESS",
        aliases=("business", "enterprise", "market", "finance", "industry"),
    ),
    TopicDefinition(
        label="DATA",
        aliases=("dataset", "data", "corpus", "synthetic data", "data curation"),
    ),
    TopicDefinition(
        label="DEVELOPMENT",
        aliases=("coding", "code", "software", "developer", "programming"),
    ),
    TopicDefinition(
        label="GOVERNMENT",
        aliases=("government", "policy", "regulation", "public sector", "governance"),
    ),
    TopicDefinition(
        label="GPUS",
        aliases=("GPU", "CUDA", "accelerator", "hardware", "inference speed"),
    ),
    TopicDefinition(
        label="IMAGE",
        aliases=("image", "vision", "diffusion", "visual", "multimodal"),
    ),
    TopicDefinition(
        label="INFRA",
        aliases=("infrastructure", "serving", "deployment", "systems", "distributed"),
    ),
    TopicDefinition(
        label="LLMS",
        aliases=("large language model", "LLM", "language model", "transformer"),
    ),
    TopicDefinition(
        label="OPEN_SOURCE",
        aliases=("open source", "open-source", "open model", "open weights"),
    ),
    TopicDefinition(
        label="POST_TRAINING",
        aliases=("post-training", "post training", "fine-tuning", "alignment", "RLHF"),
    ),
    TopicDefinition(
        label="REASONING",
        aliases=("reasoning", "chain-of-thought", "planning", "math", "logic"),
    ),
    TopicDefinition(
        label="RETRIEVAL",
        aliases=("retrieval", "RAG", "search", "information retrieval"),
    ),
    TopicDefinition(
        label="ROBOTICS",
        aliases=("robot", "robotics", "embodied", "manipulation", "navigation"),
    ),
    TopicDefinition(
        label="SECURITY",
        aliases=("security", "safety", "jailbreak", "adversarial", "privacy"),
    ),
    TopicDefinition(
        label="TRAINING_INFRA",
        aliases=("training infrastructure", "distributed training", "parallel training", "scaling"),
    ),
    TopicDefinition(
        label="VIBE_CODING",
        aliases=("coding agent", "code assistant", "AI coding", "software agent"),
    ),
    TopicDefinition(
        label="VIDEO",
        aliases=("video", "text-to-video", "video generation", "video diffusion"),
    ),
)
