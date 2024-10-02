const defaultFieldValueName = 'AnSVq5a_ibi2E*M<|/>'
const defaultFieldValuePageEndCursor = 'JcYjI~m.<HQ%j}hv1%'
const defaultIssueId = 1009
const defaultLabelNameValue = '5~hg?<[kjHwGhUII-p:'
const defaultLabelPageEndCursor = 'UjLu&s>NWO+eo_Z|Cg('
const defaultProjectItemId = 65248239
const defaultProjectOwnerLogin = '29;UhhP@%nooLB#ms'

export default { // all test data returns a unique copy to avoid complications from side effects
  getFieldValuePOJO () {
    return {
      name: defaultFieldValueName
    }
  },

  getFieldValuePagePOJO () {
    return {
      edges: [
        {
          node: {
            name: defaultFieldValueName
          }
        }
      ],
      pageInfo: {
        endCursor: defaultFieldValuePageEndCursor,
        hasNextPage: true
      }
    }
  },
  getDifferentValuePagePOJO () {
    return {
      edges: [
        {
          node: {
            name: '~o9{5S/WT|<>FLuMS'
          }
        }
      ],
      pageInfo: {
        endCursor: 'D=if(!.SUZ+H=h"+Ae',
        hasNextPage: false
      }
    }
  },
  getFieldValuePagePOJOWithMultipleFieldValues () {
    return {
      edges: [
        {
          node: {
            name: defaultFieldValueName
          }
        },
        {
          node: {
            name: '7ZM@fyoDrP!i8-mf(M'
          }
        }
      ],
      pageInfo: {
        endCursor: defaultFieldValuePageEndCursor,
        hasNextPage: true
      }
    }
  },

  getIssuePagePOJO () {
    return {
      edges: [
        {
          node: {
            number: defaultIssueId,
            labels: {
              edges: [
                {
                  node: {
                    name: defaultLabelNameValue
                  }
                }
              ],
              pageInfo: {
                endCursor: defaultLabelPageEndCursor,
                hasNextPage: true
              }
            },
            projectItems: {
              edges: [
                {
                  node: {
                    databaseId: defaultProjectItemId,
                    fieldValues: {
                      edges: [
                        {
                          node: {
                            name: defaultFieldValueName
                          }
                        }
                      ],
                      pageInfo: {
                        endCursor: defaultFieldValuePageEndCursor,
                        hasNextPage: true
                      }
                    },
                    project: {
                      number: 1,
                      owner: {
                        login: defaultProjectOwnerLogin
                      }
                    }
                  }
                }
              ],
              pageInfo: {
                endCursor: defaultFieldValuePageEndCursor,
                hasNextPage: false
              }
            }
          }
        }
      ],
      pageInfo: {
        endCursor: 'cursor',
        hasNextPage: true
      }
    }
  },
  getInvalidIssuePagePOJO () {
    return {
      edges: [
        {
          node: {
            number: defaultIssueId,
            labels: {
              edges: [
                {
                  node: {
                    name: defaultLabelNameValue
                  }
                }
              ],
              pageInfo: {
                endCursor: defaultLabelPageEndCursor,
                hasNextPage: true
              }
            },
            projectItems: {
              edges: [
                {
                  node: {
                    databaseId: defaultProjectItemId,
                    fieldValues: {
                      edges: [
                        {
                          node: {
                            name: defaultFieldValueName
                          }
                        }
                      ],
                      pageInfo: {
                        endCursor: defaultFieldValuePageEndCursor,
                        hasNextPage: true
                      }
                    },
                    project: {
                      number: 1,
                      owner: {
                        login: defaultProjectOwnerLogin
                      }
                    }
                  }
                }
              ],
              pageInfo: {
                endCursor: defaultFieldValuePageEndCursor,
                hasNextPage: false
              }
            }
          }
        }
      ],
      pageInfo: {
        endCursor: 'cursor'
      }
    }
  },

  getIssuePOJO () {
    return {
      number: defaultIssueId,
      labels: {
        edges: [
          {
            node: {
              name: defaultLabelNameValue
            }
          }
        ],
        pageInfo: {
          endCursor: defaultLabelPageEndCursor,
          hasNextPage: true
        }
      },
      projectItems: {
        edges: [
          {
            node: {
              databaseId: defaultProjectItemId,
              fieldValues: {
                edges: [
                  {
                    node: {
                      name: defaultFieldValueName
                    }
                  }
                ],
                pageInfo: {
                  endCursor: defaultFieldValuePageEndCursor,
                  hasNextPage: true
                }
              },
              project: {
                number: 1,
                owner: {
                  login: defaultProjectOwnerLogin
                }
              }
            }
          }
        ],
        pageInfo: {
          endCursor: defaultFieldValuePageEndCursor,
          hasNextPage: false
        }
      }
    }
  },
  getIssuePOJOWithInvalidLabelPage () {
    return {
      number: defaultIssueId,
      labels: {
        pageInfo: null
      },
      projectItems: {
        edges: [
          {
            node: {
              databaseId: defaultProjectItemId,
              fieldValues: {
                edges: [
                  {
                    node: {
                      name: defaultFieldValueName
                    }
                  }
                ],
                pageInfo: {
                  endCursor: defaultFieldValuePageEndCursor,
                  hasNextPage: true
                }
              },
              project: {
                number: 1,
                owner: {
                  login: defaultProjectOwnerLogin
                }
              }
            }
          }
        ],
        pageInfo: {
          endCursor: defaultFieldValuePageEndCursor,
          hasNextPage: false
        }
      }
    }
  },
  getIssuePOJOWithInvalidValueTypes () {
    return {
      number: 'wrong type for number',
      labels: [],
      projectItems: {
        edges: [
          {
            node: {
              databaseId: defaultProjectItemId,
              fieldValues: {
                edges: [
                  {
                    node: {
                      name: defaultFieldValueName
                    }
                  }
                ],
                pageInfo: {
                  endCursor: defaultFieldValuePageEndCursor,
                  hasNextPage: true
                }
              },
              project: {
                number: 1,
                owner: {
                  login: defaultProjectOwnerLogin
                }
              }
            }
          }
        ],
        pageInfo: {
          endCursor: defaultFieldValuePageEndCursor,
          hasNextPage: false
        }
      }
    }
  },
  getIssuePOJOWithInvalidProjectItemPage () {
    return {
      number: defaultIssueId,
      labels: {
        edges: [
          {
            node: {
              name: defaultLabelNameValue
            }
          }
        ],
        pageInfo: {
          endCursor: defaultLabelPageEndCursor,
          hasNextPage: true
        }
      },
      projectItems: {
        pageInfo: null
      }
    }
  },
  getIssuePOJOWithManyLabels () {
    return {
      number: defaultIssueId,
      labels: {
        edges: [
          {
            node: {
              name: defaultLabelNameValue
            }
          },
          {
            node: {
              name: 'jC8?&U0V`Cch4)II/10#'
            }
          },
          {
            node: {
              name: 'lA0$,&jb.>d<Hi3{*[B'
            }
          }
        ],
        pageInfo: {
          endCursor: defaultLabelPageEndCursor,
          hasNextPage: true
        }
      },
      projectItems: {
        edges: [
          {
            node: {
              databaseId: defaultProjectItemId,
              fieldValues: {
                edges: [
                  {
                    node: {
                      name: defaultFieldValueName
                    }
                  }
                ],
                pageInfo: {
                  endCursor: defaultFieldValuePageEndCursor,
                  hasNextPage: true
                }
              },
              project: {
                number: 1,
                owner: {
                  login: defaultProjectOwnerLogin
                }
              }
            }
          }
        ],
        pageInfo: {
          endCursor: defaultFieldValuePageEndCursor,
          hasNextPage: false
        }
      }
    }
  },
  getIssuePOJOWithManyProjectItems () {
    return {
      number: defaultIssueId,
      labels: {
        edges: [
          {
            node: {
              name: defaultLabelNameValue
            }
          }
        ],
        pageInfo: {
          endCursor: defaultLabelPageEndCursor,
          hasNextPage: true
        }
      },
      projectItems: {
        edges: [
          {
            node: {
              databaseId: 65248238,
              fieldValues: {
                edges: [],
                pageInfo: {
                  endCursor: '2N>VOeNZnx8"}7\'}-E',
                  hasNextPage: true
                }
              },
              project: {
                number: 1,
                owner: {
                  login: defaultProjectOwnerLogin
                }
              }
            }
          },
          {
            node: {
              databaseId: defaultProjectItemId,
              fieldValues: {
                edges: [
                  {
                    node: {
                      name: defaultFieldValueName
                    }
                  }
                ],
                pageInfo: {
                  endCursor: defaultFieldValuePageEndCursor,
                  hasNextPage: true
                }
              },
              project: {
                number: 1,
                owner: {
                  login: defaultProjectOwnerLogin
                }
              }
            }
          },
          {
            node: {
              databaseId: 65248240,
              fieldValues: {
                edges: [
                  {
                    node: {
                      name: 'e?+aYAe8>^X6|xaM='
                    }
                  }
                ],
                pageInfo: {
                  endCursor: '=0HoWr%^z3QjW5W%:%',
                  hasNextPage: true
                }
              },
              project: {
                number: 2,
                owner: {
                  login: 'non matching project'
                }
              }
            }
          }
        ],
        pageInfo: {
          endCursor: defaultFieldValuePageEndCursor,
          hasNextPage: false
        }
      }
    }
  },
  getIssuePOJOWithManyProjectItemsAndAllGraphQLPagesHavingAdditionalRemoteData () {
    return {
      number: defaultIssueId,
      labels: {
        edges: [
          {
            node: {
              name: defaultLabelNameValue
            }
          }
        ],
        pageInfo: {
          endCursor: defaultLabelPageEndCursor,
          hasNextPage: true
        }
      },
      projectItems: {
        edges: [
          {
            node: {
              databaseId: 65248238,
              fieldValues: {
                edges: [],
                pageInfo: {
                  endCursor: '2N>VOeNZnx8"}7\'}-E',
                  hasNextPage: true
                }
              },
              project: {
                number: 1,
                owner: {
                  login: defaultProjectOwnerLogin
                }
              }
            }
          },
          {
            node: {
              databaseId: defaultProjectItemId,
              fieldValues: {
                edges: [
                  {
                    node: {
                      name: defaultFieldValueName
                    }
                  }
                ],
                pageInfo: {
                  endCursor: defaultFieldValuePageEndCursor,
                  hasNextPage: true
                }
              },
              project: {
                number: 1,
                owner: {
                  login: defaultProjectOwnerLogin
                }
              }
            }
          },
          {
            node: {
              databaseId: 65248240,
              fieldValues: {
                edges: [
                  {
                    node: {
                      name: 'e?+aYAe8>^X6|xaM='
                    }
                  }
                ],
                pageInfo: {
                  endCursor: '=0HoWr%^z3QjW5W%:%',
                  hasNextPage: true
                }
              },
              project: {
                number: 2,
                owner: {
                  login: 'non matching project'
                }
              }
            }
          }
        ],
        pageInfo: {
          endCursor: defaultFieldValuePageEndCursor,
          hasNextPage: true
        }
      }
    }
  },
  getIssuePOJOWithoutColumnNames () {
    return {
      number: defaultIssueId,
      labels: {
        edges: [
          {
            node: {
              name: defaultLabelNameValue
            }
          }
        ],
        pageInfo: {
          endCursor: defaultLabelPageEndCursor,
          hasNextPage: true
        }
      },
      projectItems: {
        edges: [
          {
            node: {
              databaseId: defaultProjectItemId,
              fieldValues: {
                edges: [],
                pageInfo: {
                  endCursor: defaultFieldValuePageEndCursor,
                  hasNextPage: false
                }
              },
              project: {
                number: 1,
                owner: {
                  login: defaultProjectOwnerLogin
                }
              }
            }
          }
        ],
        pageInfo: {
          endCursor: defaultFieldValuePageEndCursor,
          hasNextPage: false
        }
      }
    }
  },
  getIssuePOJOWithoutColumnNamesAndIncompleteLocalSearchSpace () {
    return {
      number: defaultIssueId,
      labels: {
        edges: [
          {
            node: {
              name: defaultLabelNameValue
            }
          }
        ],
        pageInfo: {
          endCursor: defaultLabelPageEndCursor,
          hasNextPage: true
        }
      },
      projectItems: {
        edges: [
          {
            node: {
              databaseId: defaultProjectItemId,
              fieldValues: {
                edges: [],
                pageInfo: {
                  endCursor: defaultFieldValuePageEndCursor,
                  hasNextPage: true
                }
              },
              project: {
                number: 1,
                owner: {
                  login: defaultProjectOwnerLogin
                }
              }
            }
          }
        ],
        pageInfo: {
          endCursor: defaultFieldValuePageEndCursor,
          hasNextPage: true
        }
      }
    }
  },
  getIssuePOJOWithoutLabels () {
    return {
      number: defaultIssueId,
      projectItems: {
        edges: [
          {
            node: {
              databaseId: defaultProjectItemId,
              fieldValues: {
                edges: [
                  {
                    node: {
                      name: defaultFieldValueName
                    }
                  }
                ],
                pageInfo: {
                  endCursor: defaultFieldValuePageEndCursor,
                  hasNextPage: true
                }
              },
              project: {
                number: 1,
                owner: {
                  login: defaultProjectOwnerLogin
                }
              }
            }
          }
        ],
        pageInfo: {
          endCursor: defaultFieldValuePageEndCursor,
          hasNextPage: false
        }
      }
    }
  },

  getCompleteLabelPagePOJO () {
    return {
      edges: [
        {
          node: {
            name: defaultLabelNameValue
          }
        }
      ],
      pageInfo: {
        endCursor: defaultLabelPageEndCursor,
        hasNextPage: false
      }
    }
  },
  getEmptyLabelPagePOJO () {
    return {
      edges: [],
      pageInfo: {
        endCursor: defaultLabelPageEndCursor,
        hasNextPage: false
      }
    }
  },
  getLabelPagePOJO () {
    return {
      edges: [
        {
          node: {
            name: defaultLabelNameValue
          }
        }
      ],
      pageInfo: {
        endCursor: defaultLabelPageEndCursor,
        hasNextPage: true
      }
    }
  },

  getLabelPOJO () {
    return {
      name: defaultLabelNameValue
    }
  },

  getPagePOJOMinimal () {
    return {
      edges: [
        {
          node: {
            name: defaultFieldValueName
          }
        }
      ],
      pageInfo: {
        endCursor: defaultFieldValuePageEndCursor,
        hasNextPage: true
      }
    }
  },
  getPagePOJOWithInvalidNode () {
    return {
      edges: [
        {
          node: {
            name: defaultFieldValueName
          }
        }, {
          node: {
            wrongKey: '+=Xh(TZCqK}e\\@]O1s[@'
          }
        }
      ],
      pageInfo: {
        endCursor: defaultFieldValuePageEndCursor,
        hasNextPage: true
      }
    }
  },
  getPagePOJOWithMultipleNodes () {
    return {
      edges: [
        {
          node: {
            name: defaultFieldValueName
          }
        },
        {
          node: {
            name: '+=Xh(TZCqK}e\@]O1s[@'
          }
        }
      ],
      pageInfo: {
        endCursor: defaultFieldValuePageEndCursor,
        hasNextPage: true
      }
    }
  },

  getProjectItemPOJO () {
    return {
      databaseId: defaultProjectItemId,
      fieldValues: {
        edges: [
          {
            node: {
              name: defaultFieldValueName
            }
          }
        ],
        pageInfo: {
          endCursor: defaultFieldValuePageEndCursor,
          hasNextPage: true
        }
      },
      project: {
        number: 1,
        owner: {
          login: defaultProjectOwnerLogin
        }
      }
    }
  },
  getProjectItemPOJOWithInvalidFieldValuePage () {
    return {
      databaseId: defaultProjectItemId,
      fieldValues: {},
      project: {
        number: 1,
        owner: {
          login: defaultProjectOwnerLogin
        }
      }
    }
  },
  getProjectItemPOJOWithoutColumnName () {
    return {
      databaseId: defaultProjectItemId,
      fieldValues: {
        edges: [
          {
            node: {}
          }
        ],
        pageInfo: {
          endCursor: defaultFieldValuePageEndCursor,
          hasNextPage: false
        }
      },
      project: {
        number: 1,
        owner: {
          login: defaultProjectOwnerLogin
        }
      }
    }
  },
  getProjectItemPOJOWithoutLocalColumnName () {
    return {
      databaseId: defaultProjectItemId,
      fieldValues: {
        edges: [
          {
            node: {}
          }
        ],
        pageInfo: {
          endCursor: defaultFieldValuePageEndCursor,
          hasNextPage: true
        }
      },
      project: {
        number: 1,
        owner: {
          login: defaultProjectOwnerLogin
        }
      }
    }
  },
  getMergeableProjectItemPagePOJO () {
    return {
      edges: [
        {
          node: {
            databaseId: defaultProjectItemId,
            fieldValues: {
              edges: [
                {
                  node: {
                    name: defaultFieldValueName
                  }
                }
              ],
              pageInfo: {
                endCursor: defaultFieldValuePageEndCursor,
                hasNextPage: true
              }
            },
            project: {
              number: 1,
              owner: {
                login: defaultProjectOwnerLogin
              }
            }
          }
        },
        {
          node: {
            databaseId: 90285654630,
            fieldValues: {
              edges: [],
              pageInfo: {
                endCursor: 'lxk*H+Ev*[0j~)L|Kv',
                hasNextPage: true
              }
            },
            project: {
              number: 1,
              owner: {
                login: 'T~{dZqN%M~i=0<KAwa'
              }
            }
          }
        }
      ],
      pageInfo: {
        endCursor: '!tHp1v],T\\C/*:,eI',
        hasNextPage: true
      }
    }
  },
  getProjectItemPagePOJOToBeMerged () {
    return {
      edges: [
        {
          node: {
            databaseId: defaultProjectItemId,
            fieldValues: {
              edges: [
                {
                  node: {
                    name: defaultFieldValueName
                  }
                }
              ],
              pageInfo: {
                endCursor: defaultFieldValuePageEndCursor,
                hasNextPage: true
              }
            },
            project: {
              number: 1,
              owner: {
                login: defaultProjectOwnerLogin
              }
            }
          }
        },
        {
          node: {
            databaseId: 90285654630,
            fieldValues: {
              edges: [
                {
                  node: {
                    name: '%)ALv_]LP\\j?x=REc/'
                  }
                }
              ],
              pageInfo: {
                endCursor: 'lxk*H+Ev*[0j~)L|Kv',
                hasNextPage: true
              }
            },
            project: {
              number: 1,
              owner: {
                login: 'T~{dZqN%M~i=0<KAwa'
              }
            }
          }
        },
        {
          node: {
            databaseId: 984379821739,
            fieldValues: {
              edges: [
                {
                  node: {
                    name: '@I03BGK{ya2.PysEl['
                  }
                }
              ],
              pageInfo: {
                endCursor: 'A"v\\l@zC`AjH{>N&C.',
                hasNextPage: true
              }
            },
            project: {
              number: 2,
              owner: {
                login: 'B$KjFFd&-n@m"qC;#"'
              }
            }
          }
        }
      ],
      pageInfo: {
        endCursor: '!tHp1v],T\\C/*:,eI',
        hasNextPage: false
      }
    }
  }
}
