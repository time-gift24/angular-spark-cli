/**
 * Mock Review Data
 *
 * Provides sample data for SOP 文档评测系统
 * 文档结构：原文 (长文档) -> AI 分段段落 -> 检测结果
 */

import type {
  ReviewQueueVM,
  ReviewItemVM,
  OutputVM,
  ReviewQueueRouteParams,
  OriginalDocument,
  DocumentSegment,
} from './review.model';

/**
 * Mock route parameters
 */
export const mockRouteParams: ReviewQueueRouteParams = {
  cycleId: 'sop-eval-001',
  experimentId: 'exp-2024-001',
  assetId: 'sop-model-v1',
};

/**
 * Mock check results for SOP segments
 */
const mockCheckResults: OutputVM[] = [
  {
    outputId: 'check-1',
    checkItemName: '格式规范检查',
    score: 95,
    passed: true,
    message: '段落格式符合 SOP 规范要求。',
    metadata: {
      severity: 'none',
      formatRules: ['heading', 'numbering', 'indentation'],
    },
  },
  {
    outputId: 'check-2',
    checkItemName: '内容完整性检查',
    score: 88,
    passed: true,
    message: '内容覆盖了该节点的所有必需要素。',
    metadata: {
      requiredElements: ['purpose', 'scope', 'responsibility'],
      coveredElements: ['purpose', 'scope', 'responsibility'],
    },
  },
  {
    outputId: 'check-3',
    checkItemName: '术语一致性检查',
    score: 72,
    passed: true,
    message: '部分术语与标准术语表存在差异，建议统一。',
    metadata: {
      totalTerms: 25,
      matchedTerms: 18,
      mismatchedTerms: 7,
    },
  },
  {
    outputId: 'check-4',
    checkItemName: '流程逻辑检查',
    score: 100,
    passed: true,
    message: '流程描述逻辑清晰，无明显矛盾或遗漏。',
  },
];

/**
 * Mock SOP document segments
 */
const mockSegments: DocumentSegment[] = [
  {
    segmentId: 'seg-001',
    segmentIndex: 1,
    content: '## 1. 目的\n\n本标准作业程序（SOP）的目的是规范客户服务质量评审流程，确保所有评审活动遵循统一标准，提高评审效率和准确性。',
    checkResults: mockCheckResults,
  },
  {
    segmentId: 'seg-002',
    segmentIndex: 2,
    content: '## 2. 适用范围\n\n本 SOP 适用于所有涉及客户服务质量评审的部门和个人，包括但不限于：\n\n- 客户服务部\n- 质量保证部\n- 相关管理人员',
    checkResults: [
      {
        outputId: 'check-5',
        checkItemName: '格式规范检查',
        score: 92,
        passed: true,
        message: '格式基本规范，建议添加编号样式说明。',
      },
      {
        outputId: 'check-6',
        checkItemName: '内容完整性检查',
        score: 100,
        passed: true,
        message: '适用范围描述完整，包含所有相关部门。',
      },
    ],
  },
  {
    segmentId: 'seg-003',
    segmentIndex: 3,
    content: '## 3. 评审标准\n\n3.1 响应时间标准\n- 一级问题：30分钟内响应\n- 二级问题：2小时内响应\n- 三级问题：4小时内响应\n\n3.2 解决率标准\n- 首次解决率应达到 85% 以上\n- 24小时内解决率应达到 95% 以上',
    checkResults: [
      {
        outputId: 'check-7',
        checkItemName: '数据准确性检查',
        score: 68,
        passed: true,
        message: '时间指标需要与最新 KPI 标准对齐。',
      },
    ],
  },
  {
    segmentId: 'seg-004',
    segmentIndex: 4,
    content: '## 4. 评审流程\n\n4.1 评审准备\n评审前需要准备以下材料：\n- 近期服务记录\n- 客户反馈汇总\n- 系统性能报告\n\n4.2 评审实施\n评审小组应按照以下步骤进行：\n1. 收集相关数据\n2. 分析数据趋势\n3. 识别问题点\n4. 制定改进措施',
    checkResults: [
      {
        outputId: 'check-8',
        checkItemName: '流程逻辑检查',
        score: 100,
        passed: true,
        message: '流程描述清晰，步骤合理。',
      },
      {
        outputId: 'check-9',
        checkItemName: '可操作性检查',
        score: 90,
        passed: true,
        message: '流程描述具体，可操作性强。',
      },
    ],
  },
  {
    segmentId: 'seg-005',
    segmentIndex: 5,
    content: '## 5. 异常处理\n\n当出现以下异常情况时，应启动应急预案：\n- 系统宕机超过 30 分钟\n- 客户投诉量突增 50% 以上\n- 发现重大安全漏洞\n\n应急预案负责人应在 15 分钟内启动响应流程。',
    checkResults: [
      {
        outputId: 'check-10',
        checkItemName: '完整性检查',
        score: 85,
        passed: true,
        message: '异常场景覆盖较为全面，建议增加网络攻击场景。',
      },
    ],
  },
];

/**
 * Mock original SOP document
 */
const mockOriginalDoc: OriginalDocument = {
  docId: 'sop-doc-001',
  title: '客户服务质量评审标准作业程序',
  content: mockSegments.map(s => s.content).join('\n\n'),
  segments: mockSegments,
};

/**
 * Mock review items in queue
 */
const mockItems: ReviewItemVM[] = [
  {
    itemId: 'doc-001',
    originalDoc: mockOriginalDoc,
    currentSegment: mockSegments[0],
    outputs: mockSegments[0].checkResults,
    systemConclusion: 'pass',
  },
  {
    itemId: 'doc-002',
    originalDoc: {
      docId: 'sop-doc-002',
      title: '产品缺陷管理标准作业程序',
      content: '## 1. 目的\n\n本 SOP 用于规范产品缺陷的识别、报告和修复流程...',
      segments: [
        {
          segmentId: 'seg-006',
          segmentIndex: 1,
          content: '## 1. 目的\n\n本 SOP 用于规范产品缺陷的识别、报告和修复流程，确保产品质量持续改进。',
          checkResults: [
            {
              outputId: 'check-11',
              checkItemName: '格式规范检查',
              score: 98,
              passed: true,
              message: '格式符合规范。',
            },
          ],
        },
      ],
    },
    currentSegment: {
      segmentId: 'seg-006',
      segmentIndex: 1,
      content: '## 1. 目的\n\n本 SOP 用于规范产品缺陷的识别、报告和修复流程，确保产品质量持续改进。',
      checkResults: [
        {
          outputId: 'check-11',
          checkItemName: '格式规范检查',
          score: 98,
          passed: true,
          message: '格式符合规范。',
        },
      ],
    },
    outputs: [
      {
        outputId: 'check-11',
        checkItemName: '格式规范检查',
        score: 98,
        passed: true,
        message: '格式符合规范。',
      },
    ],
    systemConclusion: 'pass',
  },
  {
    itemId: 'doc-003',
    originalDoc: {
      docId: 'sop-doc-003',
      title: '安全事件响应标准作业程序',
      content: '## 1. 目的\n\n规范安全事件响应流程...',
      segments: [
        {
          segmentId: 'seg-007',
          segmentIndex: 1,
          content: '## 1. 目的\n\n规范安全事件响应流程，降低安全风险影响。',
          checkResults: [
            {
              outputId: 'check-12',
              checkItemName: '内容完整性检查',
              score: 45,
              passed: false,
              message: '缺少应急预案触发条件说明。',
            },
            {
              outputId: 'check-13',
              checkItemName: '术语一致性检查',
              score: 60,
              passed: true,
              message: '部分术语需要与安全术语标准对齐。',
            },
          ],
        },
      ],
    },
    currentSegment: {
      segmentId: 'seg-007',
      segmentIndex: 1,
      content: '## 1. 目的\n\n规范安全事件响应流程，降低安全风险影响。',
      checkResults: [
        {
          outputId: 'check-12',
          checkItemName: '内容完整性检查',
          score: 45,
          passed: false,
          message: '缺少应急预案触发条件说明。',
        },
        {
          outputId: 'check-13',
          checkItemName: '术语一致性检查',
          score: 60,
          passed: true,
          message: '部分术语需要与安全术语标准对齐。',
        },
      ],
    },
    outputs: [
      {
        outputId: 'check-12',
        checkItemName: '内容完整性检查',
        score: 45,
        passed: false,
        message: '缺少应急预案触发条件说明。',
      },
      {
        outputId: 'check-13',
        checkItemName: '术语一致性检查',
        score: 60,
        passed: true,
        message: '部分术语需要与安全术语标准对齐。',
      },
    ],
    systemConclusion: 'risk',
  },
  {
    itemId: 'doc-004',
    originalDoc: {
      docId: 'sop-doc-004',
      title: '数据备份与恢复标准作业程序',
      content: '## 1. 目的\n\n确保数据可恢复性...',
      segments: [
        {
          segmentId: 'seg-008',
          segmentIndex: 1,
          content: '## 1. 目的\n\n确保关键业务数据的可恢复性，最小化数据丢失风险。',
          checkResults: [
            {
              outputId: 'check-14',
              checkItemName: '技术可行性检查',
              score: 30,
              passed: false,
              message: '备份策略未明确备份频率和保留周期。',
            },
          ],
        },
      ],
    },
    currentSegment: {
      segmentId: 'seg-008',
      segmentIndex: 1,
      content: '## 1. 目的\n\n确保关键业务数据的可恢复性，最小化数据丢失风险。',
      checkResults: [
        {
          outputId: 'check-14',
          checkItemName: '技术可行性检查',
          score: 30,
          passed: false,
          message: '备份策略未明确备份频率和保留周期。',
        },
      ],
    },
    outputs: [
      {
        outputId: 'check-14',
        checkItemName: '技术可行性检查',
        score: 30,
        passed: false,
        message: '备份策略未明确备份频率和保留周期。',
      },
    ],
    systemConclusion: 'fail',
  },
  {
    itemId: 'doc-005',
    originalDoc: {
      docId: 'sop-doc-005',
      title: '客户投诉处理标准作业程序',
      content: '## 1. 目的\n\n规范投诉处理流程...',
      segments: [
        {
          segmentId: 'seg-009',
          segmentIndex: 1,
          content: '## 1. 目的\n\n规范客户投诉处理流程，提升客户满意度。',
          checkResults: [
            {
              outputId: 'check-15',
              checkItemName: '格式规范检查',
              score: 100,
              passed: true,
              message: '格式完全符合规范。',
            },
            {
              outputId: 'check-16',
              checkItemName: '客户体验检查',
              score: 92,
              passed: true,
              message: '投诉处理时限设置合理。',
            },
          ],
        },
      ],
    },
    currentSegment: {
      segmentId: 'seg-009',
      segmentIndex: 1,
      content: '## 1. 目的\n\n规范客户投诉处理流程，提升客户满意度。',
      checkResults: [
        {
          outputId: 'check-15',
          checkItemName: '格式规范检查',
          score: 100,
          passed: true,
          message: '格式完全符合规范。',
        },
        {
          outputId: 'check-16',
          checkItemName: '客户体验检查',
          score: 92,
          passed: true,
          message: '投诉处理时限设置合理。',
        },
      ],
    },
    outputs: [
      {
        outputId: 'check-15',
        checkItemName: '格式规范检查',
        score: 100,
        passed: true,
        message: '格式完全符合规范。',
      },
      {
        outputId: 'check-16',
        checkItemName: '客户体验检查',
        score: 92,
        passed: true,
        message: '投诉处理时限设置合理。',
      },
    ],
    systemConclusion: 'pass',
  },
];

/**
 * Mock review queue view model
 */
export const mockReviewQueue: ReviewQueueVM = {
  cycleId: mockRouteParams.cycleId,
  totalItems: mockItems.length,
  currentIndex: 1,
  reviewedItems: 0,
  acceptedItems: 0,
  progressPercent: 0,
  passRate: null,
  items: mockItems,
};

/**
 * Get a specific item from mock queue
 */
export function getMockItem(itemId: string): ReviewItemVM | undefined {
  return mockItems.find((item) => item.itemId === itemId);
}

/**
 * Get current item based on index
 */
export function getCurrentMockItem(index: number): ReviewItemVM | undefined {
  return mockItems[index - 1] || mockItems[0];
}

/**
 * Simulate API delay for async operations
 */
export function mockDelay(ms: number = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
