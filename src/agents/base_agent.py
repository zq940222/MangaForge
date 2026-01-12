"""
Base Agent Class for MangaForge

All agents inherit from this base class which provides common functionality.
"""
from abc import ABC, abstractmethod
from typing import Any, TypeVar

from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph
from pydantic import BaseModel

StateType = TypeVar("StateType", bound=BaseModel)


class AgentState(BaseModel):
    """Base state model for all agents."""

    messages: list[BaseMessage] = []
    current_step: str = "start"
    error: str | None = None
    result: dict[str, Any] = {}


class BaseAgent(ABC):
    """Base class for all MangaForge agents."""

    name: str = "base_agent"
    description: str = "Base agent class"

    def __init__(self):
        self.graph = self._build_graph()

    @abstractmethod
    def _build_graph(self) -> StateGraph:
        """Build the agent's state graph.

        Returns:
            StateGraph: The compiled state graph for this agent.
        """
        pass

    @abstractmethod
    async def run(self, input_data: dict[str, Any]) -> dict[str, Any]:
        """Execute the agent's main task.

        Args:
            input_data: Input data for the agent to process.

        Returns:
            dict: The result of the agent's execution.
        """
        pass

    def get_status(self) -> dict[str, Any]:
        """Get the current status of the agent.

        Returns:
            dict: Status information including name, description, and state.
        """
        return {
            "name": self.name,
            "description": self.description,
            "status": "ready",
        }
