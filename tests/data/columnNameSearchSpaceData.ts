import { ExtendedColumnNameSearchSpaceResponse, FieldValuePageResponse, GraphQLPagePOJO, IssuePOJO, LabelPOJO, ProjectItemPageResponse } from '../../src/githubAPIClient'

const defaultFieldValuePageEndCursor = 'JcYjI~m.<HQ%j}hv1%'
const defaultIssueId = 'njp\\.B#27utGAE~,k^'
const defaultIssueNumber = 1009
const defaultProjectItemPageEndCursor = 'j<|CDe;V2Xp;H\'@D^"'

function getEmptyLabelPage (): GraphQLPagePOJO<LabelPOJO> {
  return {
    edges: [],
    pageInfo: {
      endCursor: null,
      hasNextPage: false
    }
  }
}

export default {
  getExtendedColumnNameResponseContainingAnIncompleteProjectItemPageAndAnIncompleteFieldValuePage (): ExtendedColumnNameSearchSpaceResponse {
    return {
      node: {
        number: 1,
        projectItems: {
          edges: [
            {
              node: {
                id: '|sA7{l$P_=<W:Ks\'Ul',
                fieldValues: {
                  edges: [
                    {
                      node: {}
                    },
                    {
                      node: {}
                    }
                  ],
                  pageInfo: {
                    hasNextPage: true,
                    endCursor: 'b"z-7(8eF~M8w8\\x5P'
                  }
                },
                project: {
                  number: 1,
                  owner: {
                    login: 'p<Sk636S"U\\~xm"b>_'
                  }
                }
              }
            }
          ],
          pageInfo: {
            hasNextPage: true,
            endCursor: defaultProjectItemPageEndCursor
          }
        }
      }
    }
  },
  getExtendedColumnNameResponseContainingAColumnNameAndIncompletePages (): ExtendedColumnNameSearchSpaceResponse {
    return {
      node: {
        number: 1,
        projectItems: {
          edges: [
            {
              node: {
                id: '|sA7{l$P_=<W:Ks\'Ul',
                fieldValues: {
                  edges: [
                    {
                      node: {}
                    },
                    {
                      node: {}
                    }
                  ],
                  pageInfo: {
                    hasNextPage: true,
                    endCursor: 'b"z-7(8eF~M8w8\\x5P'
                  }
                },
                project: {
                  number: 1,
                  owner: {
                    login: 'p<Sk636S"U\\~xm"b>_'
                  }
                }
              }
            }
          ],
          pageInfo: {
            hasNextPage: true,
            endCursor: defaultProjectItemPageEndCursor
          }
        }
      }
    }
  },
  getExtendedColumnNameResponseContainingTwoColumnNamesAndOnlyCompletePages (): ExtendedColumnNameSearchSpaceResponse {
    return {
      node: {
        number: 1,
        projectItems: {
          edges: [
            {
              node: {
                id: '9]Wt.#k1R1zyh&*$\\J',
                fieldValues: {
                  edges: [
                    {
                      node: {
                        name: 'ti-cj]%MYG{[<{&eqR'
                      }
                    }
                  ],
                  pageInfo: {
                    endCursor: '+jeYN,/239y;B[)"ul',
                    hasNextPage: false
                  }
                },
                project: {
                  number: 1,
                  owner: {
                    login: 'p<Sk636S"U\\~xm"b>_'
                  }
                }
              }
            },
            {
              node: {
                id: '~Kpiz\\M/1R,c\\[=SiP',
                fieldValues: {
                  edges: [
                    {
                      node: {
                        name: 'im#6+n[JYPl`$UOS71'
                      }
                    }
                  ],
                  pageInfo: {
                    endCursor: '>R,9A$\'Knj&;_f@Jd2',
                    hasNextPage: false
                  }
                },
                project: {
                  number: 2,
                  owner: {
                    login: 'p<Sk636S"U\\~xm"b>_'
                  }
                }
              }
            }
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: defaultProjectItemPageEndCursor
          }
        }
      }
    }
  },

  getFieldValuePageResponseContainingAColumnNameAndNoAdditionalPagesIndicated (): FieldValuePageResponse {
    return {
      node: {
        fieldValues: {
          edges: [
            {
              node: {
                name: '!;bP:fU2xY8Sh[.?h,'
              }
            }
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: '!()mR.2+s;=\'x`5i:U'
          }
        }
      }
    }
  },

  getIssuePOJOWithCompleteSearchSpaceContainingMultipleColumnNames (): IssuePOJO {
    return {
      id: defaultIssueId,
      number: defaultIssueNumber,
      labels: getEmptyLabelPage(),
      projectItems: {
        edges: [
          {
            node: {
              id: '-P34.$e(JN/%!Ld"-o',
              fieldValues: {
                edges: [
                  {
                    node: {
                      name: 'FcDpp3/-K>]wBDF;<+'
                    }
                  }
                ],
                pageInfo: {
                  endCursor: 'b"z-7(8eF~M8w8\\x5P',
                  hasNextPage: false
                }
              },
              project: {
                number: 1,
                owner: {
                  login: 'zM0x?^FWWI^P=(Orjz'
                }
              }
            }
          },
          {
            node: {
              id: 'FnC9mzt(Olx00c266i',
              fieldValues: {
                edges: [
                  {
                    node: {
                      name: 'O,#n(e*p)I:Dd]`xD!'
                    }
                  }
                ],
                pageInfo: {
                  endCursor: 'zZ)+.`>s1]frU(nh2t',
                  hasNextPage: false
                }
              },
              project: {
                number: 2,
                owner: {
                  login: 'v0Yc&C[yg;@OjR+5:='
                }
              }
            }
          },
          {
            node: {
              id: 'p~!m;o2%&UZw<X_yG*',
              fieldValues: {
                edges: [
                  {
                    node: {
                      name: '2*gj8eMu$ky8Afb-~<'
                    }
                  }
                ],
                pageInfo: {
                  endCursor: 'yvGmQY[E7l#7vFfGv[',
                  hasNextPage: false
                }
              },
              project: {
                number: 2,
                owner: {
                  login: 'J\\3AYiMFArLr\'r7GYX'
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
  getIssuePOJOWithCompleteSearchSpaceContainingDuplicateColumnNamesWithDifferentCase (): IssuePOJO {
    return {
      id: defaultIssueId,
      number: defaultIssueNumber,
      labels: getEmptyLabelPage(),
      projectItems: {
        edges: [
          {
            node: {
              id: '-P34.$e(JN/%!Ld"-o',
              fieldValues: {
                edges: [
                  {
                    node: {
                      name: 'Duplicate Name'
                    }
                  }
                ],
                pageInfo: {
                  endCursor: 'b"z-7(8eF~M8w8\\x5P',
                  hasNextPage: false
                }
              },
              project: {
                number: 1,
                owner: {
                  login: 'zM0x?^FWWI^P=(Orjz'
                }
              }
            }
          },
          {
            node: {
              id: 'FnC9mzt(Olx00c266i',
              fieldValues: {
                edges: [
                  {
                    node: {
                      name: 'duplicate name'
                    }
                  }
                ],
                pageInfo: {
                  endCursor: 'zZ)+.`>s1]frU(nh2t',
                  hasNextPage: false
                }
              },
              project: {
                number: 2,
                owner: {
                  login: 'v0Yc&C[yg;@OjR+5:='
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
  getIssuePOJOWithCompleteSearchSpaceContainingManyProjectItems (): IssuePOJO {
    return {
      id: defaultIssueId,
      number: defaultIssueNumber,
      labels: getEmptyLabelPage(),
      projectItems: {
        edges: [
          {
            node: {
              id: '-P34.$e(JN/%!Ld"-o',
              fieldValues: {
                edges: [
                  {
                    node: {}
                  }
                ],
                pageInfo: {
                  endCursor: 'b"z-7(8eF~M8w8\\x5P',
                  hasNextPage: false
                }
              },
              project: {
                number: 1,
                owner: {
                  login: 'zM0x?^FWWI^P=(Orjz'
                }
              }
            }
          },
          {
            node: {
              id: 'FnC9mzt(Olx00c266i',
              fieldValues: {
                edges: [
                  {
                    node: {
                      name: 'O,#n(e*p)I:Dd]`xD!'
                    }
                  }
                ],
                pageInfo: {
                  endCursor: 'zZ)+.`>s1]frU(nh2t',
                  hasNextPage: false
                }
              },
              project: {
                number: 2,
                owner: {
                  login: 'v0Yc&C[yg;@OjR+5:='
                }
              }
            }
          },
          {
            node: {
              id: 'p~!m;o2%&UZw<X_yG*',
              fieldValues: {
                edges: [
                  {
                    node: {
                      name: '2*gj8eMu$ky8Afb-~<'
                    }
                  }
                ],
                pageInfo: {
                  endCursor: 'yvGmQY[E7l#7vFfGv[',
                  hasNextPage: false
                }
              },
              project: {
                number: 2,
                owner: {
                  login: 'J\\3AYiMFArLr\'r7GYX'
                }
              }
            }
          },
          {
            node: {
              id: 'e}\'ZIDwd\\p_#Q7nRt',
              fieldValues: {
                edges: [
                  {
                    node: {
                      name: 'FcDpp3/-K>]wBDF;<+'
                    }
                  }
                ],
                pageInfo: {
                  endCursor: '\'L=NuW;GN5r_*lyxgI',
                  hasNextPage: false
                }
              },
              project: {
                number: 1,
                owner: {
                  login: 'J\\3AYiMFArLr\'r7GYX'
                }
              }
            }
          },
          {
            node: {
              id: '}eAnx.&,<V;}[{}2f?',
              fieldValues: {
                edges: [
                  {
                    node: {}
                  }
                ],
                pageInfo: {
                  endCursor: 'P?Z5>__u.=L:k$+/"F',
                  hasNextPage: false
                }
              },
              project: {
                number: 1,
                owner: {
                  login: 'zM0x?^FWWI^P=(Orjz'
                }
              }
            }
          },
          {
            node: {
              id: 'PpVTHvRBlCcNm_QE5B',
              fieldValues: {
                edges: [
                  {
                    node: {}
                  }
                ],
                pageInfo: {
                  endCursor: 'QcN{PE*Sr.xs#U|JZ;',
                  hasNextPage: false
                }
              },
              project: {
                number: 1,
                owner: {
                  login: 'zM0x?^FWWI^P=(Orjz'
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
  getIssuePOJOWithCompleteEmptySearchSpace (): IssuePOJO {
    return {
      id: defaultIssueId,
      number: defaultIssueNumber,
      labels: getEmptyLabelPage(),
      projectItems: {
        edges: [
          {
            node: {
              id: '$oqr&F!hDi]pr?;Xe3',
              fieldValues: {
                edges: [
                  {
                    node: {}
                  }
                ],
                pageInfo: {
                  endCursor: 'b"z-7(8eF~M8w8\\x5P',
                  hasNextPage: false
                }
              },
              project: {
                number: 1,
                owner: {
                  login: 'zM0x?^FWWI^P=(Orjz'
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
  getIssuePOJOWithIncompleteEmptySearchSpace (): IssuePOJO {
    return {
      id: defaultIssueId,
      number: defaultIssueNumber,
      labels: getEmptyLabelPage(),
      projectItems: {
        edges: [
          {
            node: {
              id: '|sA7{l$P_=<W:Ks\'Ul',
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
                  login: 'zM0x?^FWWI^P=(Orjz'
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
  getIssuePOJOWithIncompleteSearchSpaceContainingOneColumnName (): IssuePOJO {
    return {
      id: defaultIssueId,
      number: defaultIssueNumber,
      labels: getEmptyLabelPage(),
      projectItems: {
        edges: [
          {
            node: {
              id: '9]Wt.#k1R1zyh&*$\\J',
              fieldValues: {
                edges: [
                  {
                    node: {
                      name: 'ti-cj]%MYG{[<{&eqR'
                    }
                  }
                ],
                pageInfo: {
                  endCursor: 'b"z-7(8eF~M8w8\\x5P',
                  hasNextPage: false
                }
              },
              project: {
                number: 1,
                owner: {
                  login: 'zM0x?^FWWI^P=(Orjz'
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

  getProjectItemPageResponseContainingTwoColumnNamesAndNoAdditionalPagesIndicated (): ProjectItemPageResponse {
    return {
      node: {
        projectItems: {
          edges: [
            {
              node: {
                id: 'ANE5_c0$i8;R];My]O',
                fieldValues: {
                  edges: [
                    {
                      node: {
                        name: '%}v%b:ed~c/u:A-Tl]'
                      }
                    }
                  ],
                  pageInfo: {
                    hasNextPage: false,
                    endCursor: 'jauH?}-/^Qq$}QJ+pv'
                  }
                },
                project: {
                  number: 2,
                  owner: {
                    login: 'c0bg/$!6o~/F%-nVLB'
                  }
                }
              }
            },
            {
              node: {
                id: '][[v`\\l?M~^FpypW9$',
                fieldValues: {
                  edges: [
                    {
                      node: {
                        name: ')dhO-\\Am9}f$Av@j4W'
                      }
                    }
                  ],
                  pageInfo: {
                    hasNextPage: false,
                    endCursor: '@O4_ajGfj<(\'?GF3DL'
                  }
                },
                project: {
                  number: 2,
                  owner: {
                    login: 'o:.@i8Y0#x!/?bK(v`'
                  }
                }
              }
            }
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: '7J<}-\'3kEGAOheq7.('
          }
        }
      }
    }
  }
}
