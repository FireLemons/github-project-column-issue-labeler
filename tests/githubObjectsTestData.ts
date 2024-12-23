const defaultFieldValueName = 'AnSVq5a_ibi2E*M<|/>'
const defaultFieldValuePageEndCursor = 'JcYjI~m.<HQ%j}hv1%'
const defaultIssueId = 'njp\\.B#27utGAE~,k^'
const defaultIssueNumber = 1009
const defaultLabelNameValue = '5~hg?<[kjHwGhUII-p:'
const defaultLabelPageEndCursor = 'UjLu&s>NWO+eo_Z|Cg('
const defaultProjectItemId = '8dU\\=8EB6bdGGTu.CL'
const defaultProjectItemPageEndCursor = 'j<|CDe;V2Xp;H\'@D^"'
const defaultProjectOwnerLogin = '29;UhhP@%nooLB#ms'
const idOfProjectItemToBeMerged = 'B)\')eMiV\'I~$jVoNlw'

export default { // all test data returns a unique copy to avoid complications from side effects
  getEmptyPagePOJO () {
    return {
      edges: [],
      pageInfo: {
        endCursor: defaultLabelPageEndCursor,
        hasNextPage: false
      }
    }
  },

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
  getLastFieldValuePagePOJO () {
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
            id: defaultIssueId,
            number: defaultIssueNumber,
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
                    id: defaultProjectItemId,
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
            id: defaultIssueId,
            number: defaultIssueNumber,
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
                    id: defaultProjectItemId,
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
                endCursor: defaultProjectItemPageEndCursor,
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
      id: defaultIssueId,
      number: defaultIssueNumber,
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
              id: defaultProjectItemId,
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
          endCursor: defaultProjectItemPageEndCursor,
          hasNextPage: false
        }
      }
    }
  },
  getIssuePOJOWithInvalidLabelPage () {
    return {
      id: defaultIssueId,
      number: defaultIssueNumber,
      labels: {
        pageInfo: null
      },
      projectItems: {
        edges: [
          {
            node: {
              id: defaultProjectItemId,
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
          endCursor: defaultProjectItemPageEndCursor,
          hasNextPage: false
        }
      }
    }
  },
  getIssuePOJOWithInvalidValueTypes () {
    return {
      id: defaultIssueId,
      number: 'wrong type for number',
      labels: [],
      projectItems: {
        edges: [
          {
            node: {
              id: defaultProjectItemId,
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
          endCursor: defaultProjectItemPageEndCursor,
          hasNextPage: false
        }
      }
    }
  },
  getIssuePOJOWithInvalidProjectItemPage () {
    return {
      id: defaultIssueId,
      number: defaultIssueNumber,
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
      id: defaultIssueId,
      number: defaultIssueNumber,
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
              id: defaultProjectItemId,
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
          endCursor: defaultProjectItemPageEndCursor,
          hasNextPage: false
        }
      }
    }
  },
  getIssuePOJOWithManyProjectItemsAndAllGraphQLPagesHavingAdditionalRemoteData () {
    return {
      id: defaultIssueId,
      number: defaultIssueNumber,
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
              id: 'n<:=&7FB#yklU()"p^',
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
              id: defaultProjectItemId,
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
              id: 'p.#a]F.*<K#d_"IqbL',
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
          endCursor: defaultProjectItemPageEndCursor,
          hasNextPage: true
        }
      }
    }
  },
  getIssuePOJOWithoutLabels () {
    return {
      id: defaultIssueId,
      number: defaultIssueNumber,
      projectItems: {
        edges: [
          {
            node: {
              id: defaultProjectItemId,
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
          endCursor: defaultProjectItemPageEndCursor,
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
      id: defaultProjectItemId,
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
      id: defaultProjectItemId,
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
      id: defaultProjectItemId,
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
  getMergeableProjectItemPagePOJO () {
    return {
      edges: [
        {
          node: {
            id: defaultProjectItemId,
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
            id: idOfProjectItemToBeMerged,
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
            id: defaultProjectItemId,
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
            id: idOfProjectItemToBeMerged,
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
            id: 'f,WS(FpfN|:9qP6vf"',
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
