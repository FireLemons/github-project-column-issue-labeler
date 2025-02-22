const defaultRepoValue = {
  name: 'repo name',
  ownerName: 'repo owner'
}

const minimalLabelingActions = [
  {
    action: 'add',
    labels: ['label']
  }
]

const columnMissingLabelingActions = {
  name: 'column name'
}
const columnMissingName = {
  labelingActions: minimalLabelingActions
}
const columnEmptyName = {
  name: '       ',
  labelingActions: minimalLabelingActions
}

export default {
  configMissingKey: JSON.stringify({
    'wrong-name-for-github-token': 'token',
    repo: defaultRepoValue,
    columns: [
    ]
  }),
  configWhiteSpaceOnlyAccessToken: JSON.stringify({
    accessToken: ' ',
    repo: defaultRepoValue,
    columns: [
    ]
  }),
  configWrongTypeAccessToken: JSON.stringify({
    accessToken: 3,
    repo: defaultRepoValue,
    columns: [
    ]
  }),
  configWrongTypeColumns: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepoValue,
    columns: 'not supposed to be a string'
  }),
  configWrongTypeProjects: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepoValue,
    projects: 'not supposed to be a string'
  }),
  configWrongTypeRepo: JSON.stringify({
    accessToken: 'token',
    repo: [],
    columns: [
      {
        name: 'to do',
        labelingActions: [
          {
            action: 'add',
            labels: ['hacktoberfest']
          }
        ]
      }
    ]
  }),
  configInvalidNonEssentialSections: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepoValue,
    projects: [
      {
        ownerLogin: 'valid project',
        columns: [
          {
            name: 'valid column',
            labelingActions: [
              {
                action: 'Add',
                labels: ['Help Wanted']
              },
              {
                action: 'Remove',
                labels: ['Done', 'Completed', '', 4, '     ']
              },
              {
                action: 'invalid action',
                labels: ['invalid label 1', 'invalid label 2']
              }
            ]
          },
          {
            name: 'invalid column'
          }
        ]
      },
      {
        ownerLogin: 'invalid project'
      }
    ]
  }),
  configNormal: JSON.stringify({
    accessToken: 'access token',
    repo: defaultRepoValue,
    projects: [
      {
        ownerLogin: 'githubOrganizationName',
        number: 2,
        columns: [
          {
            name: 'to do',
            labelingActions: [
              {
                action: 'add',
                labels: ['hacktoberfest']
              },
              {
                action: 'add',
                labels: ['todo', 'help wanted']
              },
              {
                action: 'remove',
                labels: ['🐌', 'Completed']
              }
            ]
          },
          {
            name: 'completed',
            labelingActions: [
              {
                action: 'remove',
                labels: ['hacktoberfest']
              },
              {
                action: 'remove',
                labels: ['todo', 'help wanted']
              }
            ]
          }
        ]
      }
    ]
  }),
  configTrailingWhitespaceValues: JSON.stringify({
    accessToken: ' access token ',
    repo: {
      ownerName: ' repo owner ',
      name: ' repo name '
    },
    projects: [
      {
        ownerLogin: ' owner name ',
        columns: [
          {
            name: ' column name ',
            labelingActions: [
              {
                action: ' add ',
                labels: ['label ', ' label 2', ' label 3 ']
              },
              {
                action: 'add',
                labels: [' label ', 'label 2 ', ' label 3 ']
              },
              {
                action: ' remove ',
                labels: [' 🐌 ', '   Completed']
              }
            ]
          }
        ]
      }
    ]
  }),

  columnAllInvalidlabelingActions: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepoValue,
    columns: [
      {
        name: 'column name',
        labelingActions: [
          {
          },
          {
            action: 'ADD'
          },
          {
            labels: ['a', 'b', 'c']
          },
          {
            action: 3,
            labels: ['a', 'b', 'c']
          },
          {
            action: 'ADD',
            labels: {
              a: 'a'
            }
          },
          {
            action: 'Unsupported Action',
            labels: ['a', 'b', 'c']
          }
        ]
      }
    ]
  }),
  columnArrayValuesWrongType: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepoValue,
    columns: [
      3,
      [],
      null
    ]
  }),
  columnDuplicateNames: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepoValue,
    columns: [
      {
        name: 'duplicate name',
        labelingActions: [
          {
            action: 'ADD',
            labels: ['Label1']
          }
        ]
      },
      {
        name: 'duplicate name',
        labelingActions: [
          {
            action: 'REMOVE',
            labels: ['Label2']
          }
        ]
      }
    ]
  }),
  columnInvalidValues: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepoValue,
    columns: [
      {
        name: 3,
        labelingActions: []
      },
      {
        name: 'Name',
        labelingActions: 3
      },
      {
        name: '                 ',
        labelingActions: []
      },
      {
        name: '',
        labelingActions: []
      }
    ]
  }),
  columnLabelDuplicationAndUnsortedAddRemoveActions: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepoValue,
    columns: [
      {
        name: 'column name',
        labelingActions: [
          {
            action: 'AdD',
            labels: ['Duplicate Label', 'New', 'Duplicate Label']
          },
          {
            action: 'ADD ',
            labels: ['DuplIcate LaBeL    ', 'Help Wanted']
          },
          {
            action: 'ReMovE',
            labels: ['Duplicate emoji 🐌 ', '   Completed']
          },
          {
            action: 'ReMOVE',
            labels: ['DupliCAte Emoji 🐌', 'Completed 1']
          }
        ]
      }
    ]
  }),
  columnMinimal: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepoValue,
    columns: [
      {
        name: 'column name',
        labelingActions: [
          {
            action: 'add',
            labels: ['Label']
          }
        ]
      }
    ]
  }),
  columnMissingRequiredKey: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepoValue,
    columns: [
      {
        name: 'String'
      },
      {
        labelingActions: []
      }
    ]
  }),

  invalidJSON: `
    {
      keyWithoutQuotes: "value"
    }`,

  labelingActionsActionOrderPrecedence: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepoValue,
    columns: [
      {
        name: 'column name',
        labelingActions: [
          {
            action: 'Set',
            labels: ['This should not appear']
          },
          {
            action: 'Set',
            labels: ['This should not appear']
          },
          {
            action: 'Set',
            labels: ['This should appear', '🛩', 'alphabetically first']
          }
        ]
      }
    ]
  }),
  lableingRulesActionTypePrecedence: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepoValue,
    columns: [
      {
        name: 'column name',
        labelingActions: [
          {
            action: 'Remove',
            labels: ['This should not appear']
          },
          {
            action: 'Set',
            labels: ['This should appear', '🛩', 'alphabetically first']
          },
          {
            action: 'Add',
            labels: ['This should not appear']
          }
        ]
      }
    ]
  }),
  labelingActionsConflict: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepoValue,
    columns: [
      {
        name: 'column name',
        labelingActions: [
          {
            action: 'Remove',
            labels: ['ambiguous label conflict', 'Label 1']
          },
          {
            action: 'Add',
            labels: ['ambiguous label conflict', 'Label 2']
          }
        ]
      }
    ]
  }),
  labelingActionsInvalidLabels: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepoValue,
    columns: [
      {
        name: 'column name',
        labelingActions: [
          {
            action: 'ADD',
            labels: ['', '    ', 3]
          },
          {
            action: 'REMOVE',
            labels: ['normal rule']
          }
        ]
      }
    ]
  }),
  labelingActionsSetActionAndDuplicateLabels: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepoValue,
    columns: [
      {
        name: 'column name',
        labelingActions: [
          {
            action: 'SET ',
            labels: ['DuplIcate LaBeL    ', 'Help Wanted', 'Duplicate Label', 'New', 'Duplicate Label']
          }
        ]
      }
    ]
  }),

  projectArrayValuesWrongType: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepoValue,
    projects: [
      3,
      [],
      null
    ]
  }),
  projectConfigWithSiblingsAndHighEntropyValues: JSON.stringify({
    accessToken: '3uKoGF^fkn&=rrP+lJ',
    repo: {
      name: '9\'JAt<KOd2r!b|r=t}',
      ownerName: 'BSZLsS+J9nDC~/(`qu'
    },
    projects: [
      {
        ownerLogin: '"yJN3*vG?fH="Bk5jn',
        number: 6890140931,
        columns: [
          {
            name: 'r[/G}&\'tV3*ZK\'!TUv',
            labelingActions: [
              {
                action: 'add',
                labels: ['^g9)"kS%xm8e{`kp@K']
              }
            ]
          }
        ]
      },
      {
        ownerLogin: '3b@dvLyBr*j<-&R23=',
        number: 1471946274,
        columns: [
          {
            name: 'l57ZO;F$@#64/t^Q"^',
            labelingActions: [
              {
                action: 'add',
                labels: ['}Vk}3#7!*&dW-WLz|+', 'krI#)7Zm-`G0U$sCU5']
              }
            ]
          }
        ]
      }
    ]
  }),
  projectDuplicatesWithDuplicateChildren: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepoValue,
    projects: [
      {
        ownerLogin: 'duplicate project with number',
        number: 1,
        columns: [
          {
            name: 'symmetric duplicate column A',
            labelingActions: [
              {
                action: 'add',
                labels: ['grouped label A', 'grouped label C']
              }
            ]
          }
        ]
      },
      {
        ownerLogin: 'duplicate project with number',
        number: 1,
        columns: [
          {
            name: 'symmetric duplicate column A',
            labelingActions: [
              {
                action: 'add',
                labels: ['grouped label D', 'grouped label B']
              }
            ]
          },
          {
            name: 'asymmetric duplicate column A',
            labelingActions: [
              {
                action: 'remove',
                labels: ['ungrouped label A']
              }
            ]
          },
          {
            name: 'asymmetric duplicate column A',
            labelingActions: [
              {
                action: 'add',
                labels: ['ungrouped label B']
              }
            ]
          }
        ]
      },
      {
        ownerLogin: 'duplicate project without number',
        columns: [
          {
            name: 'symmetric duplicate column B',
            labelingActions: [
              {
                action: 'remove',
                labels: ['overridden label A']
              }
            ]
          }
        ]
      },
      {
        ownerLogin: 'duplicate project without number',
        columns: [
          {
            name: 'symmetric duplicate column B',
            labelingActions: [
              {
                action: 'set',
                labels: ['overriding label A']
              }
            ]
          },
          {
            name: 'asymmetric duplicate column B',
            labelingActions: [
              {
                action: 'remove',
                labels: ['grouped label G']
              }
            ]
          },
          {
            name: 'asymmetric duplicate column B',
            labelingActions: [
              {
                action: 'remove',
                labels: ['grouped label F', 'grouped label E']
              }
            ]
          },
          {
            name: 'asymmetric duplicate column C',
            labelingActions: [
              {
                action: 'set',
                labels: ['overriden label B']
              }
            ]
          },
          {
            name: 'asymmetric duplicate column C',
            labelingActions: [
              {
                action: 'set',
                labels: ['overriding label B']
              }
            ]
          }
        ]
      }
    ]
  }),
  projectInvalidValues: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepoValue,
    projects: [
      {
        columns: 3,
        ownerLogin: 'Name'
      },
      {
        columns: [],
        number: 'not a number',
        ownerLogin: 'owner name'
      },
      {
        columns: [],
        number: -1,
        ownerLogin: 'owner name'
      },
      {
        columns: [],
        number: 1.01,
        ownerLogin: 'owner name'
      },
      {
        columns: [],
        ownerLogin: 3
      },
      {
        columns: [],
        ownerLogin: '                 '
      },
      {
        columns: [],
        ownerLogin: ''
      }
    ]
  }),
  projectMinimal: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepoValue,
    projects: [
      {
        ownerLogin: 'ownerName',
        number: 1,
        columns: [
          {
            name: 'column name',
            labelingActions: [
              {
                action: 'add',
                labels: ['label']
              }
            ]
          }
        ]
      }
    ]
  }),
  projectMissingRequiredKey: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepoValue,
    projects: [
      {
        ownerLogin: 'String'
      },
      {
        columns: []
      }
    ]
  }),
  projectNearDuplicates: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepoValue,
    projects: [
      {
        ownerLogin: 'duplicateOwnerName',
        number: 1,
        columns: [
          {
            name: 'column name 1',
            labelingActions: [
              {
                action: 'add',
                labels: ['label1B', 'label1A', 'label1C']
              }
            ]
          }
        ]
      },
      {
        ownerLogin: 'duplicateOwnerName',
        number: 2,
        columns: [
          {
            name: 'column name 2',
            labelingActions: [
              {
                action: 'remove',
                labels: ['label2A', 'Label2B', 'lAbel2C']
              }
            ]
          }
        ]
      },
      {
        ownerLogin: 'nonDuplicateOwnerName',
        number: 1,
        columns: [
          {
            name: 'column name 3',
            labelingActions: [
              {
                action: 'set',
                labels: ['label3C', 'label3B', 'label3D', 'label3A']
              }
            ]
          }
        ]
      }
    ]
  }),

  repoWrongTypeName: JSON.stringify({
    accessToken: 'token',
    repo: {
      name: {},
      ownerName: 'repo owner'
    },
    columns: [
    ]
  }),
  repoWrongTypeOwnerName: JSON.stringify({
    accessToken: 'token',
    repo: {
      name: 'repo name',
      ownerName: []
    },
    columns: [
    ]
  }),
  repoWhitespaceOnlyName: JSON.stringify({
    accessToken: 'token',
    repo: {
      name: '    ',
      ownerName: 'repo owner'
    },
    columns: [
    ]
  }),
  repoWhitespaceOnlyOwnerName: JSON.stringify({
    accessToken: 'token',
    repo: {
      name: 'repo name',
      ownerName: '         '
    },
    columns: [
    ]
  })
}
