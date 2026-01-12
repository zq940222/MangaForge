"""
Story Agent - Generates story scripts and storyboards from user input.

This agent is responsible for:
1. Expanding user's story outline into a full script
2. Creating character profiles
3. Planning scene breakdowns
4. Generating panel-by-panel descriptions
"""
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, StateGraph

from src.agents.base_agent import AgentState, BaseAgent
from src.config.settings import get_settings


class StoryState(AgentState):
    """State model for Story Agent."""

    user_input: str = ""
    story_outline: str = ""
    characters: list[dict[str, Any]] = []
    scenes: list[dict[str, Any]] = []
    style: str = "manga"
    target_pages: int = 10


class StoryAgent(BaseAgent):
    """Agent for story generation and script writing."""

    name = "story_agent"
    description = "Generates complete story scripts from user outlines"

    SYSTEM_PROMPT = """You are a professional manga/comic script writer.
Your task is to expand user's story ideas into detailed scripts suitable for comic adaptation.

For each scene, provide:
1. Scene description and setting
2. Character positions and actions
3. Dialogue with emotional cues
4. Panel composition suggestions
5. Pacing and dramatic timing

Output format should be structured JSON that can be parsed for downstream processing."""

    def __init__(self):
        self.settings = get_settings()
        super().__init__()

    def _build_graph(self) -> StateGraph:
        """Build the story generation workflow graph."""
        graph = StateGraph(StoryState)

        # Add nodes
        graph.add_node("analyze_input", self._analyze_input)
        graph.add_node("generate_outline", self._generate_outline)
        graph.add_node("create_characters", self._create_characters)
        graph.add_node("write_scenes", self._write_scenes)
        graph.add_node("finalize", self._finalize)

        # Add edges
        graph.set_entry_point("analyze_input")
        graph.add_edge("analyze_input", "generate_outline")
        graph.add_edge("generate_outline", "create_characters")
        graph.add_edge("create_characters", "write_scenes")
        graph.add_edge("write_scenes", "finalize")
        graph.add_edge("finalize", END)

        return graph.compile()

    async def _analyze_input(self, state: StoryState) -> dict[str, Any]:
        """Analyze user input and extract key story elements."""
        # TODO: Implement LLM call to analyze input
        return {
            "current_step": "analyze_input",
            "messages": state.messages + [
                HumanMessage(content=f"Analyzing story input: {state.user_input[:100]}...")
            ],
        }

    async def _generate_outline(self, state: StoryState) -> dict[str, Any]:
        """Generate a detailed story outline."""
        # TODO: Implement LLM call to generate outline
        return {
            "current_step": "generate_outline",
            "story_outline": "Generated outline placeholder",
        }

    async def _create_characters(self, state: StoryState) -> dict[str, Any]:
        """Create detailed character profiles."""
        # TODO: Implement LLM call to create characters
        return {
            "current_step": "create_characters",
            "characters": [],
        }

    async def _write_scenes(self, state: StoryState) -> dict[str, Any]:
        """Write detailed scene descriptions with panel breakdowns."""
        # TODO: Implement LLM call to write scenes
        return {
            "current_step": "write_scenes",
            "scenes": [],
        }

    async def _finalize(self, state: StoryState) -> dict[str, Any]:
        """Finalize the story script and prepare for next agent."""
        return {
            "current_step": "complete",
            "result": {
                "outline": state.story_outline,
                "characters": state.characters,
                "scenes": state.scenes,
                "style": state.style,
            },
        }

    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Execute story generation.

        Args:
            input_data: Dictionary containing:
                - user_input: The user's story description
                - style: Desired comic style (manga, webtoon, etc.)
                - target_pages: Target number of pages

        Returns:
            dict: Generated story script with characters and scenes.
        """
        initial_state = StoryState(
            user_input=input_data.get("user_input", ""),
            style=input_data.get("style", "manga"),
            target_pages=input_data.get("target_pages", 10),
            messages=[
                SystemMessage(content=self.SYSTEM_PROMPT),
            ],
        )

        result = await self.graph.ainvoke(initial_state)
        return result.get("result", {})
