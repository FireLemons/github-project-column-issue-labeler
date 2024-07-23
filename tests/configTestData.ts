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
  configWhiteSpaceOnlyAccessToken: JSON.stringify({
    "accessToken": " ",
    "repo": defaultRepoValue,
    "columns": [
    ]
  }),
  configInvalidNonEssentialSections: JSON.stringify({
    "accessToken": "token",
    "repo": defaultRepoValue,
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
  }),
  configNormal: JSON.stringify({
    "accessToken": "access token",
    "repo": defaultRepoValue,
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
  }),
  configTrailingWhitespaceValues: JSON.stringify({
    "accessToken": " access token ",
    "repo": {
      "ownerName": " repo owner ",
      "name": " repo name "
    },
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
        "a": 3,
        "b": "b"
      },
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