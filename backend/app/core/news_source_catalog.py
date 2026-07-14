from dataclasses import dataclass


@dataclass(frozen=True)
class NewsSource:
    name: str
    feed_url: str
    default_topics: tuple[str, ...] = ()
    logo_url: str | None = None


def favicon_url(domain: str) -> str:
    return f"https://www.google.com/s2/favicons?domain={domain}&sz=64"


NEWS_SOURCES: tuple[NewsSource, ...] = (
    NewsSource("OpenAI", "https://openai.com/news/rss.xml", ("LLMS", "AGENTS"), favicon_url("openai.com")),
    NewsSource("Google AI", "https://blog.google/technology/ai/rss/", ("LLMS", "IMAGE"), favicon_url("google.com")),
    NewsSource("Google DeepMind", "https://deepmind.google/blog/rss.xml", ("LLMS", "REASONING"), favicon_url("deepmind.google")),
    NewsSource("Hugging Face", "https://huggingface.co/blog/feed.xml", ("OPEN_SOURCE", "LLMS"), favicon_url("huggingface.co")),
    NewsSource("GitHub", "https://github.blog/ai-and-ml/feed/", ("DEVELOPMENT", "VIBE_CODING"), favicon_url("github.com")),
    NewsSource("NVIDIA", "https://blogs.nvidia.com/blog/category/deep-learning/feed/", ("GPUS", "INFRA"), favicon_url("nvidia.com")),
    NewsSource("Mistral AI", "https://mistral.ai/rss.xml", ("OPEN_SOURCE", "LLMS"), favicon_url("mistral.ai")),
    NewsSource("The Decoder", "https://the-decoder.com/feed/", ("LLMS", "BUSINESS"), favicon_url("the-decoder.com")),
    NewsSource("TechCrunch AI", "https://techcrunch.com/category/artificial-intelligence/feed/", ("BUSINESS", "AGENTS"), favicon_url("techcrunch.com")),
    NewsSource("VentureBeat AI", "https://venturebeat.com/category/ai/feed/", ("BUSINESS", "LLMS"), favicon_url("venturebeat.com")),
    NewsSource("MIT Technology Review", "https://www.technologyreview.com/topic/artificial-intelligence/feed", ("BUSINESS", "GOVERNMENT"), favicon_url("technologyreview.com")),
    NewsSource("Berkeley BAIR", "https://bair.berkeley.edu/blog/feed.xml", ("REASONING", "ROBOTICS"), favicon_url("berkeley.edu")),
    NewsSource("AWS Machine Learning", "https://aws.amazon.com/blogs/machine-learning/feed/", ("INFRA", "BUSINESS"), favicon_url("aws.amazon.com")),
    NewsSource("Microsoft Research", "https://www.microsoft.com/en-us/research/feed/?facet%5Btax%5D%5Bmsr-research-area%5D%5B0%5D=13556", ("LLMS", "REASONING"), favicon_url("microsoft.com")),
    NewsSource("Together AI", "https://www.together.ai/blog/rss.xml", ("INFRA", "OPEN_SOURCE"), favicon_url("together.ai")),
)
