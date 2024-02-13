"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const octokit_1 = require("octokit");
const validateConfig_1 = __importDefault(require("./validateConfig"));
const Logger = __importStar(require("./logger"));
let columns_label_config = core.getInput('column_label_config');
// Javascript destructuring assignment
const { owner, repo } = github.context.repo;
const octokit = new octokit_1.Octokit({ auth: 'PERSONAL-ACCESS-TOKEN' });
const INDENTATION = '  ';
const ISSUE_PAGE_SIZE = 1; //100
const FIELD_VALUE_PAGE_SIZE = 1; //100
const LABEL_PAGE_SIZE = 1; //20
const PROJECT_ITEM_PAGE_SIZE = 1; //20
async function fetchIssuesWithLabelsAndColumn() {
    return octokit.graphql(`
  query issuesEachWithLabelsAndColumn($pageSizeIssue: Int, $pageSizeLabel: Int, $pageSizeProjectField: Int, $pageSizeProjectItem: Int, $ownerName: String!, $repoName: String!){
    repository (owner: $ownerName, name: $repoName) {
        issues (first: $pageSizeIssue) {
          ...issuePage
        }
      }
    }

    fragment issuePage on IssueConnection {
      edges {
        node {
          id
          labels (first: $pageSizeLabel) {
            ...labelPage
          }
          projectItems (first: $pageSizeProjectItem) {
            ...projectItemPage
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
      }
    }

    fragment labelPage on LabelConnection {
      edges {
        node {
          name
        }
        cursor
      }
      pageInfo {
        hasNextPage
      }
    }

    fragment projectFieldPage on ProjectV2ItemFieldValueConnection {
      edges {
        node {
          ... on ProjectV2ItemFieldSingleSelectValue {
            name
          }
        }
        cursor
      },
      pageInfo {
        hasNextPage
      }
    }

    fragment projectItemPage on ProjectV2ItemConnection {
      edges {
        node {
          fieldValues (first: $pageSizeProjectField) {
            ...projectFieldPage
          }
        }
        cursor
      },
      pageInfo {
        hasNextPage
      }
    }`, {
        pageSizeIssue: ISSUE_PAGE_SIZE,
        pageSizeLabel: LABEL_PAGE_SIZE,
        pageSizeProjectField: FIELD_VALUE_PAGE_SIZE,
        pageSizeProjectItem: PROJECT_ITEM_PAGE_SIZE,
        ownerName: owner,
        repoName: repo,
    });
}
function main() {
    try {
        Logger.info('Validating Config');
        const validColumnConfigurations = (0, validateConfig_1.default)(columns_label_config);
        if (!(validColumnConfigurations.length)) {
            Logger.error('Could not find any valid actions to perform from the configuration');
            process.exitCode = 1;
            return;
        }
        Logger.info('Validated Config:');
        Logger.info(JSON.stringify(validColumnConfigurations, null, 2));
    }
    catch (error) {
        if (error instanceof Error && error.message) {
            Logger.error('Failed to validate config');
            Logger.error(error.message);
            process.exitCode = 1;
            return;
        }
    }
    try {
        Logger.info('Fetching issues with labels and associated column data...');
        fetchIssuesWithLabelsAndColumn()
            .then((response) => {
            Logger.info('Fetched issues with labels and associated column data', INDENTATION);
            Logger.info(JSON.stringify(response, null, 2), INDENTATION.repeat(2));
        })
            .catch((error) => {
            Logger.error('Encountered errors after fetching issues with labels and associated column data', INDENTATION);
            if (error instanceof Error) {
                Logger.error(error.message, INDENTATION.repeat(2));
            }
            else {
                Logger.error(error, INDENTATION.repeat(2));
            }
        });
    }
    catch (error) {
        if (error instanceof Error && error.message) {
            Logger.error('Failed to fetch issues with labels and associated column data', INDENTATION);
            Logger.error(error.message, INDENTATION.repeat(2));
            process.exitCode = 1;
        }
        return;
    }
}
module.exports = main;
