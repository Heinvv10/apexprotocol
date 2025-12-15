/**
 * Integrations Module
 * Third-party integrations for GEO/AEO platform
 *
 * F117-F119: Jira Integration
 * F120-F121: Slack Integration
 * F122: Google Analytics Integration
 * F123: Google Search Console Integration
 * F124: Trello Integration
 * F125: Linear Integration
 * F126: Asana Integration
 */

// F117-F119: Jira Integration
export {
  JiraManager,
  jiraManager,
  formatJiraConnectionResponse,
  type JiraConnection,
  type JiraProject,
  type JiraIssue,
  type JiraIssueStatus,
  type JiraPriority,
  type JiraUser,
  type JiraWebhook,
  type CreateIssueParams,
} from "./jira";

// F120-F121: Slack Integration
export {
  SlackManager,
  slackManager,
  formatSlackConnectionResponse,
  formatSlackMessageResponse,
  type SlackConnection,
  type SlackChannel,
  type SlackMessage,
  type SlackBlock,
  type SlackReaction,
  type SendMessageParams,
} from "./slack";

// F122: Google Analytics Integration
export {
  GoogleAnalyticsManager,
  gaManager,
  formatGAConnectionResponse,
  type GAConnection,
  type GAAccount,
  type GAProperty,
  type GAMetrics,
  type GATrafficSource,
  type GAPagePerformance,
} from "./google-analytics";

// F123: Google Search Console Integration
export {
  GoogleSearchConsoleManager,
  gscManager,
  formatGSCConnectionResponse,
  type GSCConnection,
  type GSCSite,
  type GSCSearchAnalytics,
  type GSCSearchRow,
  type GSCQueryPerformance,
  type GSCPagePerformance,
  type GSCCountryPerformance,
  type GSCDevicePerformance,
  type GSCIndexingStatus,
} from "./google-search-console";

// F124: Trello Integration
export {
  TrelloManager,
  trelloManager,
  formatTrelloConnectionResponse,
  type TrelloConnection,
  type TrelloBoard,
  type TrelloList,
  type TrelloCard,
  type TrelloLabel,
  type CreateCardParams,
} from "./trello";

// F125: Linear Integration
export {
  LinearManager,
  linearManager,
  formatLinearConnectionResponse,
  type LinearConnection,
  type LinearTeam,
  type LinearProject,
  type LinearIssue,
  type LinearLabel,
  type LinearWorkflowState,
  type CreateIssueParams as LinearCreateIssueParams,
} from "./linear";

// F126: Asana Integration
export {
  AsanaManager,
  asanaManager,
  formatAsanaConnectionResponse,
  type AsanaConnection,
  type AsanaWorkspace,
  type AsanaProject,
  type AsanaSection,
  type AsanaTask,
  type AsanaTag,
  type AsanaUser,
  type CreateTaskParams,
} from "./asana";
