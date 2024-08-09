const defaultRepoValue = {
  name: "repo name",
  ownerName: "repo owner"
}

export default {
  invalidJSON: `
    {
      keyWithoutQuotes: "value"
    }`,

  configMissingKey: JSON.stringify({
    "wrong-name-for-github-token": "token",
    "repo": defaultRepoValue,
    "columns": [
    ]
  }),
  configWrongTypeAccessToken: JSON.stringify({
    "accessToken": 3,
    "repo": defaultRepoValue,
    "columns": [
    ]
  }),
  configWrongTypeColumns: JSON.stringify({
    "accessToken": "token",
    "repo": defaultRepoValue,
    "columns": "not supposed to be a string"
  }),
  configWrongTypeProjects: JSON.stringify({
    "accessToken": "token",
    "repo": defaultRepoValue,
    "projects": "not supposed to be a string"
  }),
  configWhiteSpaceOnlyAccessToken: JSON.stringify({
    "accessToken": " ",
    "repo": defaultRepoValue,
    "columns": [
    ]
  }),
  configInvalidNonEssentialSections: JSON.stringify({
    "accessToken": "token",
    "repo": defaultRepoValue,
    "projects": [
      {
        "ownerLogin": "valid project",
        "columns": [
          {
            "name": "valid column",
            "labelingRules": [
              {
                "action": "Add",
                "labels": ["Help Wanted"]
              },
              {
                "action": "Remove",
                "labels": ["Done", "Completed", "", 4, "     "]
              },
              {
                "action": "invalid action",
                "labels": ["invalid label 1", "invalid label 2"]
              }
            ]
          },
          {
            "name": "invalid column"
          }
        ]
      },
      {
        "ownerLogin": "invalid project"
      }
    ]
  }),
  configNormal: JSON.stringify({
    "accessToken": "access token",
    "repo": defaultRepoValue,
    "projects": [
      {
        "ownerLogin": "githubOrganizationName",
        "number": 2,
        "columns": [
          {
            "name": "to do",
            "labelingRules": [
              {
                "action": "add",
                "labels": ["hacktoberfest"]
              },
              {
                "action": "add",
                "labels": ["todo", "help wanted"]
              },
              {
                "action": "remove",
                "labels": ["🐌", "Completed"]
              }
            ]
          },
          {
            "name": "completed",
            "labelingRules": [
              {
                "action": "remove",
                "labels": ["hacktoberfest"]
              },
              {
                "action": "remove",
                "labels": ["todo", "help wanted"]
              }
            ]
          }
        ]
      }
    ]
  }),
  configTrailingWhitespaceValues: JSON.stringify({
    "accessToken": " access token ",
    "repo": {
      "ownerName": " repo owner ",
      "name": " repo name "
    },
    "projects": [
      {
        "ownerLogin": " owner name ",
        "columns": [
          {
            "name": " column name ",
            "labelingRules": [
              {
                "action": " add ",
                "labels": ["label ", " label 2", " label 3 "]
              },
              {
                "action": "add",
                "labels": [" label ", "label 2 ", " label 3 "]
              },
              {
                "action": " remove ",
                "labels": [" 🐌 ", "   Completed"]
              }
            ]
          }
        ]
      }
    ]
  }),

  repoWrongTypeOwnerName: JSON.stringify({
    "accessToken": "token",
    "repo": {
      "name": "repo name",
      "ownerName": []
    },
    "columns": [
    ]
  }),
  repoWrongTypeName: JSON.stringify({
    "accessToken": "token",
    "repo": {
      "name": {},
      "ownerName": "repo owner"
    },
    "columns": [
    ]
  }),

  projectArrayValuesWrongType: JSON.stringify({
    "accessToken": "token",
    "repo": defaultRepoValue,
    "projects": [
      3,
      [],
      null
    ]
  }),
  projectDuplicatesNameOnly: JSON.stringify({
    "accessToken": "token",
    "repo": defaultRepoValue,
    "projects": [
      {
        "ownerLogin": "duplicate project name 1",
        "columns": [
          {
            "name": "duplicate name",
            "labelingRules": [
              {
                "action": " add ",
                "labels": ["label 1"]
              }
            ]
          }
        ]
      },
      {
        "ownerLogin": "duplicate project name 1",
        "columns": [
          {
            "name": "duplicate name",
            "labelingRules": [
              {
                "action": "add",
                "labels": ["label 2", "label 3"]
              }
            ]
          }
        ]
      }
    ]
  }),
  projectDuplicatesNameAndNumber: JSON.stringify({
    "accessToken": "token",
    "repo": defaultRepoValue,
    "projects": [
      {
        "ownerLogin": "duplicate project name 2",
        "number": 1,
        "columns": [
          {
            "name": "column 1",
            "labelingRules": [
              {
                "action": " add ",
                "labels": ["label 1"]
              }
            ]
          }
        ]
      },
      {
        "ownerLogin": "duplicate project name 2",
        "number": 1,
        "columns": [
          {
            "name": "column 2",
            "labelingRules": [
              {
                "action": " add ",
                "labels": ["label 1"]
              }
            ]
          }
        ]
      }
    ]
  }),
  projectDuplicatesNameButNotNumber: JSON.stringify({
    "accessToken": "token",
    "repo": defaultRepoValue,
    "projects": [
      {
        "ownerLogin": "duplicate project name 3",
        "number": 1,
        "columns": [
          {
            "name": "column 2",
            "labelingRules": [
              {
                "action": " add ",
                "labels": ["label 1"]
              }
            ]
          }
        ]
      },
      {
        "ownerLogin": "duplicate project name 3",
        "number": 2,
        "columns": [
          {
            "name": "column 2",
            "labelingRules": [
              {
                "action": " add ",
                "labels": ["label 1"]
              }
            ]
          }
        ]
      }
    ]
  }),
  projectInvalidValues: JSON.stringify({
    "accessToken": "token",
    "repo": defaultRepoValue,
    "projects": [
      {
        "columns": 3,
        "ownerLogin": "Name"
      },
      {
        "columns": [],
        "number": "not a number",
        "ownerLogin": "owner name"
      },
      {
        "columns": [],
        "number": -1,
        "ownerLogin": "owner name"
      },
      {
        "columns": [],
        "number": 1.01,
        "ownerLogin": "owner name"
      },
      {
        "columns": [],
        "ownerLogin": 3
      },
      {
        "columns": [],
        "ownerLogin": "                 "
      },
      {
        "columns": [],
        "ownerLogin": ""
      }
    ]
  }),
  projectMissingRequiredKey: JSON.stringify({
    "accessToken": "token",
    "repo": defaultRepoValue,
    "projects": [
      {
        "ownerLogin": "String"
      },
      {
        "columns": []
      }
    ]
  }),

  columnAllInvalidLabelingRules: JSON.stringify({
    "accessToken": "token",
    "repo": defaultRepoValue,
    "columns": [
      {
        "name": "column name",
        "labelingRules": [
          {
          },
          {
            "action": "ADD"
          },
          {
            "labels": ["a", "b", "c"]
          },
          {
            "action": 3,
            "labels": ["a", "b", "c"]
          },
          {
            "action": "ADD",
            "labels": {
              "a": "a"
            }
          },
          {
            "action": "Unsupported Action",
            "labels": ["a", "b", "c"]
          }
        ]
      }
    ]
  }),
  columnArrayValuesWrongType: JSON.stringify({
    "accessToken": "token",
    "repo": defaultRepoValue,
    "columns": [
      3,
      [],
      null
    ]
  }),
  columnDuplicateNames: JSON.stringify({
    "accessToken": "token",
    "repo": defaultRepoValue,
    "columns": [
      {
        "name": "duplicate name",
        "labelingRules": [
          {
            "action": "ADD",
            "labels": ["Label1"]
          }
        ]
      },
      {
        "name": "duplicate name",
        "labelingRules": [
          {
            "action": "REMOVE",
            "labels": ["Label2"]
          }
        ]
      }
    ]
  }),
  columnInvalidValues: JSON.stringify({
    "accessToken": "token",
    "repo": defaultRepoValue,
    "columns": [
      {
        "name": 3,
        "labelingRules": []
      },
      {
        "name": "Name",
        "labelingRules": 3
      },
      {
        "name": "                 ",
        "labelingRules": []
      },
      {
        "name": "",
        "labelingRules": []
      }
    ]
  }),
  columnLabelDuplicationAndUnsortedAddRemoveActions: JSON.stringify({
    "accessToken": "token",
    "repo": defaultRepoValue,
    "columns": [
      {
        "name": "column name",
        "labelingRules": [
          {
            "action": "AdD",
            "labels": ["Duplicate Label", "New", "Duplicate Label"]
          },
          {
            "action": "ADD ",
            "labels": ["DuplIcate LaBeL    ", "Help Wanted"]
          },
          {
            "action": "ReMovE",
            "labels": ["Duplicate emoji 🐌 ", "   Completed"]
          },
          {
            "action": "ReMOVE",
            "labels": ["DupliCAte Emoji 🐌", "Completed 1"]
          }
        ]
      }
    ]
  }),
  columnMissingRequiredKey: JSON.stringify({
    "accessToken": "token",
    "repo": defaultRepoValue,
    "columns": [
      {
        "name": "String"
      },
      {
        "labelingRules": []
      }
    ]
  }),

  labelingRulesActionOrderPrecedence: JSON.stringify({
    "accessToken": "token",
    "repo": defaultRepoValue,
    "columns": [
      {
        "name": "column name",
        "labelingRules": [
          {
            "action": "Set",
            "labels": ["This should not appear"]
          },
          {
            "action": "Set",
            "labels": ["This should not appear"]
          },
          {
            "action": "Set",
            "labels": ["This should appear", "🛩", "alphabetically first"]
          }
        ]
      }
    ]
  }),
  lableingRulesActionTypePrecedence: JSON.stringify({
    "accessToken": "token",
    "repo": defaultRepoValue,
    "columns": [
      {
        "name": "column name",
        "labelingRules": [
          {
            "action": "Remove",
            "labels": ["This should not appear"]
          },
          {
            "action": "Set",
            "labels": ["This should appear", "🛩", "alphabetically first"]
          },
          {
            "action": "Add",
            "labels": ["This should not appear"]
          }
        ]
      }
    ]
  }),
  labelingRulesConflict: JSON.stringify({
    "accessToken": "token",
    "repo": defaultRepoValue,
    "columns": [
      {
        "name": "column name",
        "labelingRules": [
          {
            "action": "Remove",
            "labels": ["ambiguous label conflict", "Label 1"]
          },
          {
            "action": "Add",
            "labels": ["ambiguous label conflict", "Label 2"]
          }
        ]
      }
    ]
  }),
  labelingRulesInvalidLabels: JSON.stringify({
    "accessToken": "token",
    "repo": defaultRepoValue,
    "columns": [
      {
        "name": "column name",
        "labelingRules": [
          {
            "action": "ADD",
            "labels": ["", "    ", 3]
          },
          {
            "action": "REMOVE",
            "labels": ["normal rule"]
          }
        ]
      }
    ]
  }),
  labelingRulesSetActionAndDuplicateLabels: JSON.stringify({
    "accessToken": "token",
    "repo": defaultRepoValue,
    "columns": [
      {
        "name": "column name",
        "labelingRules": [
          {
            "action": "SET ",
            "labels": ["DuplIcate LaBeL    ", "Help Wanted", "Duplicate Label", "New", "Duplicate Label"]
          }
        ]
      }
    ]
  })
}
