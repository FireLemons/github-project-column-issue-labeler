/**
 * Used primarily as an expression to represent an array
 * @returns a new array combining the original array and the new element
 */
function append (arr: any[], element: any) {
  const arrCopy = arr.slice()

  arrCopy.push(element)

  return arrCopy
}

const defaultRepo = {
  name: 'repo name',
  ownerName: 'repo owner'
}

const minimalLabels = [ 'label' ]

const labelingActionEmptyLabels = {
  action: 'add',
  labels: []
}
const labelingActionInvalidLabels = {
  action: 'add',
  labels: [ '  ', 3 ]
}
const labelingActionMissingAction = {
  labels: minimalLabels
}
const labelingActionMissingLabels = {
  action: 'add'
}
const labelingActionConflictAdd = {
  action: 'add',
  labels: [ 'conflicting label' ]
}
const labelingActionConflictRemove = {
  action: 'remove',
  labels: [ 'conflicting label' ]
}
const labelingActionUnsupportedAction = {
  action: 'erase',
  labels: minimalLabels
}
const labelingActionWrongTypeAction = {
  action: 0,
  labels: minimalLabels
}
const labelingActionWrongTypeLabels = {
  action: 'add',
  labels: 0
}
const minimalLabelingActions = [
  {
    action: 'add',
    labels: minimalLabels
  }
]
const allInvalidLabelingActions = [
  'wrong type',
  labelingActionInvalidLabels,
  labelingActionMissingAction,
  labelingActionMissingLabels,
  labelingActionConflictAdd,
  labelingActionConflictRemove,
  labelingActionUnsupportedAction,
  labelingActionWrongTypeAction,
  labelingActionWrongTypeLabels
]

const columnEmptyName = {
  name: '       ',
  labelingActions: minimalLabelingActions
}
const columnInvalidLabelingActions = {
  name: 'column name',
  labelingActions: allInvalidLabelingActions
}
const columnMissingLabelingActions = {
  name: 'column name'
}
const columnMissingName = {
  labelingActions: minimalLabelingActions
}
const columnWrongTypeLabelingActions = {
  name: 'column name',
  labelingActions: 0
}
const columnWrongTypeName = {
  name: 0,
  labelingActions: minimalLabelingActions
}
const minimalColumns = [
  {
    name: 'column name',
    labelingActions: minimalLabelingActions
  }
]
const allInvalidColumns = [
  'wrong type',
  columnEmptyName,
  columnInvalidLabelingActions,
  columnMissingLabelingActions,
  columnMissingName,
  columnWrongTypeLabelingActions,
  columnWrongTypeName
]

const projectEmptyOwnerLogin = {
  columns: minimalColumns,
  number: 1,
  ownerLogin: '    '
}
const projectInvalidColumns = {
  columns: allInvalidColumns,
  number: 1,
  ownerLogin: 'owner name'
}
const projectMissingColumns = {
  number: 1,
  ownerLogin: 'owner name'
}
const projectMissingOwnerLogin = {
  columns: minimalColumns,
  number: 1
}
const projectOutOfBoundsNumber = {
  columns: minimalColumns,
  number: -1,
  ownerLogin: 'owner name'
}
const projectWrongTypeColumns = {
  columns: 0,
  number: 1,
  ownerLogin: 'owner name'
}
const projectWrongTypeNumber = {
  columns: minimalColumns,
  number: '1',
  ownerLogin: 'owner name'
}
const projectWrongTypeOwnerLogin = {
  columns: minimalColumns,
  number: 1,
  ownerLogin: 0
}
const allInvalidProjects = [
  'wrong type',
  projectEmptyOwnerLogin,
  projectInvalidColumns,
  projectMissingColumns,
  projectMissingOwnerLogin,
  projectOutOfBoundsNumber,
  projectWrongTypeColumns,
  projectWrongTypeNumber,
  projectWrongTypeOwnerLogin
]
const minimalProjects = [
  {
    columns: minimalColumns,
    ownerLogin: 'owner name'
  }
]

export default {
  configDuplicates: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepo,
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
                labels: ['ungrouped label A', 'conflicting label']
              }
            ]
          },
          {
            name: 'asymmetric duplicate column A',
            labelingActions: [
              {
                action: 'add',
                labels: ['ungrouped label B', 'conflicting label']
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
                labels: ['grouped duplicate label']
              }
            ]
          },
          {
            name: 'asymmetric duplicate column B',
            labelingActions: [
              {
                action: 'remove',
                labels: ['grouped label F', 'grouped label E', 'grouped duplicate label']
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
  configDuplicatesWithCaseMismatch: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepo,
    projects: [
      {
        ownerLogin: 'Duplicate project with number',
        number: 1,
        columns: [
          {
            name: 'Symmetric duplicate column A',
            labelingActions: [
              {
                action: 'Add',
                labels: ['grouped label A', 'duplicate label' ]
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
            name: 'symmetric duplicate column a',
            labelingActions: [
              {
                action: 'add',
                labels: ['grouped label B', 'Duplicate label']
              }
            ]
          },
          {
            name: 'Asymmetric duplicate column B',
            labelingActions: [
              {
                action: 'Remove',
                labels: ['ungrouped label A', 'conflicting label']
              }
            ]
          },
          {
            name: 'asymmetric duplicate column b',
            labelingActions: [
              {
                action: 'add',
                labels: ['ungrouped label B', 'Conflicting label']
              }
            ]
          }
        ]
      },
      {
        ownerLogin: 'Duplicate project without number',
        columns: [
          {
            name: 'Symmetric duplicate column C',
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
            name: 'symmetric duplicate column c',
            labelingActions: [
              {
                action: 'sEt',
                labels: ['overriding label A']
              }
            ]
          }
        ]
      }
    ]
  }),
  configInvalidNonEssentialSections: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepo,
    projects: append(allInvalidProjects, {
      ownerLogin: 'valid project',
      columns: [
        {
          labelingActions: [
            {
              action: 'add',
              labels: ['valid label']
            }
          ],
          name: 'valid column'
        }
      ]
    })
  }),
  configMissingKey: JSON.stringify({
    'wrong-name-for-github-token': 'token',
    repo: defaultRepo,
    columns: minimalColumns
  }),
  configTrailingWhitespaceValues: JSON.stringify({
    accessToken: ' access token ',
    repo: {
      ownerName: ' repo owner ',
      name: ' repo name '
    },
    projects: [
      {
        ownerLogin: 'owner name ',
        columns: [
          {
            name: 'column name ',
            labelingActions: [
              {
                action: ' add ',
                labels: ['label 1 ', ' label 2', ' label 2 ', 'conflicing label']
              }
            ]
          }
        ]
      },
      {
        ownerLogin: ' owner name',
        columns: [
          {
            name: ' column name',
            labelingActions: [
              {
                action: ' add ',
                labels: [' label 1  ']
              },
              {
                action: ' remove ',
                labels: [' conflicing label ']
              }
            ]
          }
        ]
      }
    ]
  }),
  configWhiteSpaceOnlyAccessToken: JSON.stringify({
    accessToken: ' ',
    repo: defaultRepo,
    columns: minimalColumns
  }),
  configWrongTypeAccessToken: JSON.stringify({
    accessToken: 3,
    repo: defaultRepo,
    columns: minimalColumns
  }),
  configWrongTypeColumns: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepo,
    columns: 'not supposed to be a string'
  }),
  configWrongTypeProjects: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepo,
    projects: 'not supposed to be a string'
  }),
  configWrongTypeRepo: JSON.stringify({
    accessToken: 'token',
    repo: [],
    columns: minimalColumns
  }),
  configNormal: JSON.stringify({
    accessToken: 'access token',
    repo: defaultRepo,
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

  columnMinimal: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepo,
    columns: minimalColumns
  }),
  columnOnlyInvalidValues: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepo,
    columns: allInvalidColumns
  }),
  columnPartiallyInvalid: append(allInvalidColumns, {
    name: 'valid column',
    labelingActions: append(allInvalidLabelingActions, minimalLabelingActions[0])
  }),

  invalidJSON: `
    {
      keyWithoutQuotes: "value"
    }`,

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
  projectOnlyInvalidValues: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepo,
    projects: allInvalidProjects
  }),
  projectMinimal: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepo,
    projects: minimalProjects
  }),
  projectNearDuplicates: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepo,
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
  projectOverridingColumn: JSON.stringify({
    accessToken: 'token',
    repo: defaultRepo,
    columns: minimalColumns,
    projects: minimalProjects
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
