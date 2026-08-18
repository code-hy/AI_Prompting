"""LLM integration via the OpenAI-compatible DeepSeek API.

Uses the meta-prompt architecture from the demo spec (§4.3): the document
context and the user's selected prompt template are injected into a system
prompt that governs LLM behaviour (execute the template, or report missing
information without hallucinating).

If no DEEPSEEK_API_KEY is set the service runs in MOCK mode: it streams a
clearly-labelled simulated response so the demo still works with no key.
"""

import os
import time
from typing import Iterator

from openai import OpenAI

DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
_OPENAI_META_ROLE = "You are an expert AI assistant integrated into a Prompt Engineering Demo. Your objective is to execute the user's selected \"Prompt Template\" using the provided \"Document Context\"."

_client: OpenAI | None = None


def is_mock_mode() -> bool:
    return not os.getenv("DEEPSEEK_API_KEY")


def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
        )
    return _client


def build_system_prompt(document_context: str, prompt_template: str) -> str:
    return f"""{_OPENAI_META_ROLE}

Document Context:
{document_context}

User's Selected Prompt Template:
{prompt_template}

Execution Rules:
1. Analyze the "Prompt Template" to identify its objective, required inputs, and expected output format.
2. Analyze the "Document Context" to see if it contains the information required to fulfill the Prompt Template.
3. If the Document Context contains the required information, execute the Prompt Template instructions perfectly and output the result.
4. If the Document Context is missing information required by the Prompt Template, DO NOT hallucinate. Output a brief response stating exactly what information is missing and ask the user to provide it.
5. Maintain a professional, analytical tone."""


def stream_chat(messages: list[dict[str, str]]) -> Iterator[str]:
    """Yield text deltas from the LLM for the given OpenAI-style messages."""
    if is_mock_mode():
        yield from _mock_stream(messages)
        return

    stream = get_client().chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=messages,
        stream=True,
        temperature=0.3,
        max_tokens=2000,
    )
    for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta
        if delta and delta.content:
            yield delta.content


# ---- Mock mode (labelled, for key-less demos) -----------------------------

def _yield_words(text: str) -> Iterator[str]:
    for word in text.split(" "):
        time.sleep(0.02)
        yield word + " "


_MISSING_INFO = (
    "To execute this prompt template and draft the Executive Summary, I need your "
    "company's capability statement. The ATO RFQ requires the summary to outline "
    "key features and benefits to the ATO. Please provide your company details so "
    "I can generate the response."
)

_MOCK_OUTPUTS = [
    (
        "capability statement",
        None,
        _MISSING_INFO,
    ),
    (
        "checklist",
        None,
        "## Bidder Readiness Checklist — REQ-260818\n\n"
        "### Mandatory actions\n"
        "- [ ] Quote must be drafted on the **RFQ Form (Attachment B)**.\n"
        "- [ ] Quote must be consistent with the **Deed of Standing Offer for Digital Marketplace "
        "Panel 2 (SON4102906)** and its Statement of Requirement.\n"
        "- [ ] Lodge the quote by email to **Yuuichi Yang and Christopher Smith** at "
        "`Weiwei.yang@ato.gov.au` and `Christopher.smith2@ato.gov.au`.\n"
        "- [ ] Submit **before 3:00 pm local time in the ACT on Friday 7 August 2026**.\n\n"
        "- [ ] Address all three evaluation criteria in the quote: **Goods and/or Services Offered**, "
        "**Delivery and Management**, and **Financial Considerations**.\n"
        "- [ ] Demonstrate capability and experience (demonstrations, references and presentations on request).\n\n"
        "### Security & information management\n"
        "- [ ] Define secure handling of ATO information.\n"
        "- [ ] Comply with Australian Government security and privacy expectations.\n"
        "- [ ] Confirm data storage, access and retention arrangements.\n"
        "- [ ] Confirm ability to work with sensitive or protected information if required.\n\n"
        "### Deliverables to scope\n"
        "- [ ] Copilot Prompt Library\n"
        "- [ ] Prompt Development Framework and Methodology\n"
        "- [ ] Prompt Testing, Assumptions, Limitations and Exception Report\n"
        "- [ ] User Guides and Usage Instructions\n"
        "- [ ] Risk Assessment and Mitigation Recommendations\n"
        "- [ ] Copilot Skills Readiness Guidance\n\n"
        "Note: the RFQ document does not reference a separate 'Cyber Security Vendor "
        "Engagement Requirements' annex; the security requirements contained in the document "
        "are captured above. Raise any questions with the contact officers listed in the RFQ.",
    ),
    (
        "evaluation criteria",
        None,
        "## Compliance & Evaluation Extraction — REQ-260818\n\n"
        "The RFQ does not publish explicit **weightings** for the evaluation criteria.\n\n"
        "### Goods and/or Services Offered\n"
        "- Quality of the goods and services offered.\n"
        "- Ability to meet the ATO's requirements, objectives and outcomes set out in the Statement of Requirement.\n"
        "- Demonstrated capability and experience in delivering the proposed services, including via "
        "demonstrations, references and presentations as requested by the ATO.\n\n"
        "### Delivery and Management\n"
        "- Proposed delivery and management arrangements (including subcontracting) to efficiently and "
        "effectively manage and deliver the goods and/or services.\n"
        "- The Tenderer's capability and capacity (including past performance).\n\n"
        "### Financial Considerations\n"
        "- Prices and pricing offered and all other financial considerations, including all relevant "
        "direct and indirect costs and benefits to the ATO over the whole procurement cycle.\n\n"
        "### What the buyer is looking for\n"
        "The ATO's Smarter Data Program is procuring AI prompt engineering services in **Microsoft "
        "Copilot** for priority AI use cases. The buyer specifically needs:\n"
        "- 20–30 production-ready prompts across ~10–15 priority business tasks.\n"
        "- A standardised prompt engineering framework, design principles and governance.\n"
        "- A prompt library design that is implementable in the ATO's Microsoft 365 environment and "
        "extensible to future Copilot Skills.\n"
        "- Knowledge transfer and capability uplift across business areas.\n"
        "- Clear security, confidentiality and information management arrangements.\n"
        "- Sole IP ownership and reuse rights over all deliverables.",
    ),
]


def _mock_stream(messages: list[dict[str, str]]) -> Iterator[str]:
    system = next((m["content"] for m in messages if m["role"] == "system"), "")
    template = ""
    if "User's Selected Prompt Template:" in system:
        template = system.split("User's Selected Prompt Template:")[1] or ""
    template_lower = template.lower()

    if "Prompt Template" not in system:  # standard chat, no template
        text = (
            "Simulated response (mock mode — no DEEPSEEK_API_KEY set). "
            "Select a prompt from the Prompt Library to see the meta-prompt "
            "architecture in action, or configure server/.env with a DeepSeek API key."
        )
    else:
        text = None
        for keyword, _, output in _MOCK_OUTPUTS:
            if keyword in template_lower:
                text = output
                break
        if text is None:
            user_msg = messages[-1]["content"] if messages else template
            snippet = " ".join(user_msg.split())[:120]
            text = (
                "Simulated response (mock mode — no DEEPSEEK_API_KEY set). "
                f"The selected template was: \"{snippet}…\". Add a DeepSeek API "
                "key to server/.env to execute this template against the REQ-260818 "
                "document with the real model."
            )
    yield from _yield_words(text)