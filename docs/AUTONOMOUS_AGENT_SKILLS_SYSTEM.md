# Autonomous Agent Skills System for Apex

## ⚠️ STATUS UPDATE: ✅ **FULLY IMPLEMENTED** (December 9, 2024)

**This document is the original design proposal. The skills system is now fully implemented in Python.**

**For implementation details, usage guide, and test results, see:**
👉 **[AUTONOMOUS_AGENT_SKILLS_INTEGRATION.md](./AUTONOMOUS_AGENT_SKILLS_INTEGRATION.md)**

**Quick start**:
```bash
# Test the skills system
python skills/test_skills.py

# Run autonomous agent with skills
python autonomous_agent_demo.py --project-dir apex
```

---

## Original Design Proposal

**Date**: December 9, 2024
**Purpose**: Define skill development framework for autonomous agents working on Apex platform
**Critical Goal**: Agents should build and use project-specific skills based on tests/specs, not generic templates

---

## 🎯 Core Concept

**Problem**: Generic autonomous agents lack project-specific knowledge about:
- Apex's brand values (Trust, Innovation, Transparency)
- White-label architecture patterns (CSS variables, brand presets)
- Design system constraints (3-tier card hierarchy, restrained colors)
- GEO/AEO domain expertise (AI platform monitoring, recommendations engine)

**Solution**: Build **project-specific skills** during development that agents can invoke for domain expertise.

---

## 📋 Skill Categories for Apex

### Category 1: Design System Skills
**Why needed**: Ensure visual cohesion across all features

#### Skill 1: `apex-design-validator`
**Triggered when**: Agent implements any UI component
**Capabilities**:
- Validates color usage (max 3-4 accent colors per view)
- Checks card hierarchy (primary/secondary/tertiary)
- Enforces glassmorphism rules (modals only, not main cards)
- Validates animation timing (150ms/250ms/800ms)
- Ensures Inter font family usage

**Implementation**:
```typescript
// skills/apex-design-validator.ts
export const apexDesignValidatorSkill = {
  name: 'apex-design-validator',
  description: 'Validate UI components against Apex design system',

  async execute(componentCode: string, componentType: 'primary-card' | 'secondary-card' | 'modal' | 'chart') {
    const violations: string[] = [];

    // Check 1: Color usage
    const colorMatches = componentCode.match(/#[0-9A-Fa-f]{6}/g) || [];
    const uniqueColors = new Set(colorMatches);
    if (uniqueColors.size > 4) {
      violations.push(`Too many colors (${uniqueColors.size}). Max 4 accent colors per view.`);
    }

    // Check 2: Card hierarchy
    if (componentType === 'primary-card') {
      if (!componentCode.includes('border-2') || !componentCode.includes('border-primary')) {
        violations.push('Primary cards require 2px primary border');
      }
    }

    // Check 3: Glassmorphism placement
    if (componentCode.includes('backdrop-filter') && componentType !== 'modal') {
      violations.push('Glassmorphism only allowed on modals/overlays, not main cards');
    }

    // Check 4: Animation timing
    const transitionMatches = componentCode.match(/transition-\[(\d+)ms\]/g) || [];
    for (const match of transitionMatches) {
      const duration = parseInt(match.match(/\d+/)?.[0] || '0');
      if (![150, 250, 300, 800].includes(duration)) {
        violations.push(`Invalid animation duration ${duration}ms. Use 150/250/300/800ms.`);
      }
    }

    // Check 5: Font family
    if (!componentCode.includes('font-display') && !componentCode.includes('font-body')) {
      violations.push('Use Inter Display for headings, Inter for body text');
    }

    return {
      valid: violations.length === 0,
      violations,
      suggestions: violations.map(v => generateFixSuggestion(v))
    };
  }
};
```

**Autonomous Agent Usage**:
```typescript
// When agent implements a component:
const componentCode = generateComponent(); // Agent's code
const validation = await skills.invoke('apex-design-validator', {
  componentCode,
  componentType: 'primary-card'
});

if (!validation.valid) {
  // Auto-fix violations
  for (const suggestion of validation.suggestions) {
    componentCode = applySuggestion(componentCode, suggestion);
  }
}
```

---

#### Skill 2: `apex-white-label-enforcer`
**Triggered when**: Agent creates/modifies any styled component
**Capabilities**:
- Ensures all colors use CSS variables (not hardcoded)
- Validates brand preset compatibility
- Checks immutable elements (verification badges, trust signals)
- Enforces customizable elements (logo, colors, fonts)

**Implementation**:
```typescript
// skills/apex-white-label-enforcer.ts
export const apexWhiteLabelEnforcerSkill = {
  name: 'apex-white-label-enforcer',
  description: 'Enforce white-label architecture compliance',

  async execute(componentCode: string) {
    const violations: string[] = [];

    // Check 1: Hardcoded colors
    const hardcodedColors = componentCode.match(/(?:bg|text|border)-\[#[0-9A-Fa-f]{6}\]/g);
    if (hardcodedColors && hardcodedColors.length > 0) {
      violations.push(`Hardcoded colors detected: ${hardcodedColors.join(', ')}. Use var(--primary), var(--success), etc.`);
    }

    // Check 2: CSS variable usage
    const cssVarUsage = componentCode.match(/var\(--[\w-]+\)/g) || [];
    const colorClasses = componentCode.match(/(?:bg|text|border)-\w+/g) || [];
    if (colorClasses.length > 0 && cssVarUsage.length === 0) {
      violations.push('Colors must use CSS variables for white-label support');
    }

    // Check 3: Immutable elements
    const immutableElements = ['verification-badge', 'trust-signal', 'impact-index', 'methodology-modal'];
    for (const element of immutableElements) {
      if (componentCode.includes(element)) {
        // Verify element cannot be customized via brand preset
        if (componentCode.includes(`brandPreset.${element}`)) {
          violations.push(`${element} is immutable - cannot be customized per brand`);
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations,
      whiteLabeLReady: violations.length === 0
    };
  }
};
```

---

### Category 2: GEO/AEO Domain Skills
**Why needed**: Agents need domain expertise for recommendations, monitoring, scoring

#### Skill 3: `geo-recommendations-generator`
**Triggered when**: Agent implements recommendation features (F019-F021)
**Capabilities**:
- Understands GEO Score components (Schema Quality, Content Completeness, AI Visibility)
- Generates contextual recommendations based on score gaps
- Prioritizes by business value × implementation effort
- Formats with proper priority badges (critical/high/medium/low)

**Implementation**:
```typescript
// skills/geo-recommendations-generator.ts
export const geoRecommendationsGeneratorSkill = {
  name: 'geo-recommendations-generator',
  description: 'Generate GEO-specific recommendations based on score analysis',

  async execute(geoScore: GEOScore) {
    const recommendations: Recommendation[] = [];

    // Analyze Schema Quality
    if (geoScore.schemaQuality < 70) {
      recommendations.push({
        id: 'rec-schema-1',
        title: 'Add FAQ Schema to key pages',
        description: 'FAQ schema helps AI understand common questions about your brand',
        priority: 'high',
        category: 'schema',
        estimatedImpact: '+8-12 points',
        implementationEffort: 'medium',
        businessValue: 8.5,
        technicalComplexity: 5,
        scoreImprovement: { schemaQuality: +10 }
      });
    }

    // Analyze Content Completeness
    if (geoScore.contentCompleteness < 60) {
      recommendations.push({
        id: 'rec-content-1',
        title: 'Create comprehensive About page',
        description: 'AI platforms prioritize brands with detailed company information',
        priority: 'critical',
        category: 'content',
        estimatedImpact: '+15-20 points',
        implementationEffort: 'high',
        businessValue: 9.2,
        technicalComplexity: 3,
        scoreImprovement: { contentCompleteness: +18 }
      });
    }

    // Analyze AI Visibility
    if (geoScore.aiVisibility < 75) {
      recommendations.push({
        id: 'rec-visibility-1',
        title: 'Optimize title tags for question-based queries',
        description: 'Rewrite titles to answer common "What is..." queries',
        priority: 'medium',
        category: 'ai-visibility',
        estimatedImpact: '+5-8 points',
        implementationEffort: 'low',
        businessValue: 7.0,
        technicalComplexity: 2,
        scoreImprovement: { aiVisibility: +6 }
      });
    }

    // Sort by priority score (businessValue × ease of implementation)
    return recommendations.sort((a, b) => {
      const scoreA = a.businessValue * (10 - a.technicalComplexity);
      const scoreB = b.businessValue * (10 - b.technicalComplexity);
      return scoreB - scoreA;
    });
  }
};
```

---

#### Skill 4: `ai-platform-monitor-expert`
**Triggered when**: Agent implements monitoring features (F010-F013)
**Capabilities**:
- Knows monitoring patterns for each platform (ChatGPT, Claude, Gemini, Perplexity, Grok, DeepSeek)
- Understands sentiment analysis for GEO context
- Formats mentions with platform-specific icons/colors
- Validates API integration patterns

**Implementation**:
```typescript
// skills/ai-platform-monitor-expert.ts
export const aiPlatformMonitorExpertSkill = {
  name: 'ai-platform-monitor-expert',
  description: 'Domain expertise for AI platform monitoring',

  platforms: {
    chatgpt: { color: '#10A37F', icon: 'MessageSquare', apiEndpoint: '/api/monitor/chatgpt' },
    claude: { color: '#D97757', icon: 'Brain', apiEndpoint: '/api/monitor/claude' },
    gemini: { color: '#4285F4', icon: 'Sparkles', apiEndpoint: '/api/monitor/gemini' },
    perplexity: { color: '#20808D', icon: 'Search', apiEndpoint: '/api/monitor/perplexity' },
    grok: { color: '#000000', icon: 'Zap', apiEndpoint: '/api/monitor/grok' },
    deepseek: { color: '#4B5563', icon: 'Telescope', apiEndpoint: '/api/monitor/deepseek' }
  },

  async generateMentionCard(mention: BrandMention) {
    const platform = this.platforms[mention.platform];

    return {
      platform: {
        name: mention.platform,
        icon: platform.icon,
        color: platform.color
      },
      sentiment: this.analyzeSentiment(mention.text),
      timestamp: mention.timestamp,
      text: mention.text,
      context: mention.context,
      styling: {
        borderColor: platform.color,
        iconBgColor: `${platform.color}10` // 10% opacity
      }
    };
  },

  analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    // GEO-specific sentiment (not generic)
    const positiveKeywords = ['recommended', 'trusted', 'leading', 'best', 'innovative', 'reliable'];
    const negativeKeywords = ['avoid', 'poor', 'unreliable', 'outdated', 'limited', 'lacking'];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveKeywords.filter(kw => lowerText.includes(kw)).length;
    const negativeCount = negativeKeywords.filter(kw => lowerText.includes(kw)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }
};
```

---

### Category 3: Test-Driven Skills
**Why needed**: Skills should be auto-generated from test specifications

#### Skill 5: `test-spec-skill-generator`
**Triggered when**: New test added to feature_list.json
**Capabilities**:
- Parses test_description field
- Extracts domain rules and constraints
- Generates validation skill automatically
- Updates skill registry

**Implementation**:
```typescript
// skills/test-spec-skill-generator.ts
export const testSpecSkillGenerator = {
  name: 'test-spec-skill-generator',
  description: 'Auto-generate skills from test specifications',

  async generateFromTest(feature: Feature) {
    const skill = {
      name: `${feature.id.toLowerCase()}-validator`,
      description: `Validate ${feature.name} implementation against specs`,
      generatedFrom: feature.id,
      rules: this.extractRules(feature.test_description),

      async execute(implementation: string) {
        const violations: string[] = [];

        // Parse rules from test description
        for (const rule of this.rules) {
          if (!this.validateRule(implementation, rule)) {
            violations.push(`Failed: ${rule.description}`);
          }
        }

        return {
          valid: violations.length === 0,
          violations,
          feature: feature.id
        };
      }
    };

    // Register skill
    skillRegistry.register(skill);

    return skill;
  },

  extractRules(testDescription: string): Rule[] {
    const rules: Rule[] = [];

    // Pattern 1: "shows: 1) X, 2) Y, 3) Z"
    const showsMatch = testDescription.match(/shows:\s*(.+)/);
    if (showsMatch) {
      const items = showsMatch[1].split(/,\s*\d+\)/);
      items.forEach((item, index) => {
        rules.push({
          type: 'visual',
          description: item.trim(),
          priority: index + 1
        });
      });
    }

    // Pattern 2: "Color tokens match X palette"
    if (testDescription.includes('Color tokens match')) {
      rules.push({
        type: 'color-validation',
        description: 'Colors must match specified palette',
        constraint: 'design-system'
      });
    }

    // Pattern 3: "Max X accent colors"
    const colorLimitMatch = testDescription.match(/max(?:imum)?\s+(\d+)\s+accent\s+colors/i);
    if (colorLimitMatch) {
      rules.push({
        type: 'color-limit',
        description: `Maximum ${colorLimitMatch[1]} accent colors`,
        limit: parseInt(colorLimitMatch[1])
      });
    }

    return rules;
  }
};
```

**Example Usage**:
```typescript
// When agent starts implementing F009 (GEO Score Gauge):
const feature = featureList.find(f => f.id === 'F009');
const skill = await testSpecSkillGenerator.generateFromTest(feature);

// Agent now has F009-specific validation skill:
const gaugeCode = generateGEOScoreGauge();
const validation = await skill.execute(gaugeCode);

if (!validation.valid) {
  console.log('Violations:', validation.violations);
  // Auto-fix or alert
}
```

---

## 🔄 Skill Development Workflow

### Phase 1: Initial Skill Creation
**When**: Before starting feature implementation
**Process**:
1. Agent reads feature from `feature_list.json`
2. Parses `test_description` and `design_reference`
3. Generates project-specific skill using `test-spec-skill-generator`
4. Registers skill in skill registry
5. Agent can now invoke skill during implementation

### Phase 2: Skill Refinement
**When**: After feature implementation and testing
**Process**:
1. Analyze test failures
2. Extract missing rules from failures
3. Update skill with new validation rules
4. Re-test with enhanced skill

### Phase 3: Skill Reuse
**When**: Implementing similar features
**Process**:
1. Agent checks skill registry for related skills
2. Invokes existing skills (e.g., `apex-design-validator` for all UI components)
3. Combines multiple skills for complex features

---

## 📊 Skill Registry Structure

```typescript
// skill-registry.ts
interface Skill {
  name: string;
  description: string;
  category: 'design-system' | 'domain-expertise' | 'validation' | 'white-label';
  generatedFrom?: string; // Feature ID if auto-generated from test
  triggers: string[]; // When to invoke this skill
  execute: (input: any) => Promise<SkillResult>;
}

interface SkillRegistry {
  skills: Map<string, Skill>;

  register(skill: Skill): void;
  invoke(skillName: string, input: any): Promise<SkillResult>;
  findByCategory(category: string): Skill[];
  findByTrigger(trigger: string): Skill[];
}

// Example registry for Apex
const apexSkillRegistry: SkillRegistry = {
  skills: new Map([
    ['apex-design-validator', apexDesignValidatorSkill],
    ['apex-white-label-enforcer', apexWhiteLabelEnforcerSkill],
    ['geo-recommendations-generator', geoRecommendationsGeneratorSkill],
    ['ai-platform-monitor-expert', aiPlatformMonitorExpertSkill],
    ['test-spec-skill-generator', testSpecSkillGenerator],
    // Auto-generated skills from tests:
    ['f009-validator', /* generated from F009 test */],
    ['f021-validator', /* generated from F021 test */],
  ]),

  async invoke(skillName: string, input: any) {
    const skill = this.skills.get(skillName);
    if (!skill) {
      throw new Error(`Skill not found: ${skillName}`);
    }
    return await skill.execute(input);
  }
};
```

---

## 🤖 Autonomous Agent Integration

### Agent Workflow with Skills

```typescript
// autonomous-agent.ts
class ApexAutonomousAgent {
  private skillRegistry: SkillRegistry;

  async implementFeature(featureId: string) {
    const feature = this.getFeature(featureId);

    // Step 1: Generate skill from test spec
    console.log(`Generating skill for ${featureId}...`);
    const validationSkill = await this.skillRegistry.invoke('test-spec-skill-generator', { feature });

    // Step 2: Implement feature
    console.log(`Implementing ${feature.name}...`);
    let implementation = await this.generateImplementation(feature);

    // Step 3: Invoke relevant skills
    const skills = this.getRelevantSkills(feature);
    for (const skill of skills) {
      console.log(`Validating with ${skill.name}...`);
      const result = await this.skillRegistry.invoke(skill.name, implementation);

      if (!result.valid) {
        console.log(`Validation failed: ${result.violations.join(', ')}`);
        implementation = await this.fixViolations(implementation, result.violations);
      }
    }

    // Step 4: Test with Playwright
    await this.testWithPlaywright(feature, implementation);

    // Step 5: Mark as passing
    await this.updateFeatureStatus(featureId, true);
  }

  getRelevantSkills(feature: Feature): Skill[] {
    const skills: Skill[] = [];

    // Always use design validator for UI features
    if (feature.category === 'ui') {
      skills.push(this.skillRegistry.skills.get('apex-design-validator')!);
      skills.push(this.skillRegistry.skills.get('apex-white-label-enforcer')!);
    }

    // Domain-specific skills
    if (feature.name.includes('Recommendations')) {
      skills.push(this.skillRegistry.skills.get('geo-recommendations-generator')!);
    }

    if (feature.name.includes('Monitor') || feature.name.includes('Platform')) {
      skills.push(this.skillRegistry.skills.get('ai-platform-monitor-expert')!);
    }

    // Feature-specific validation skill
    const validatorSkill = this.skillRegistry.skills.get(`${feature.id.toLowerCase()}-validator`);
    if (validatorSkill) {
      skills.push(validatorSkill);
    }

    return skills;
  }
}
```

---

## 📝 Skill Development Guidelines

### 1. Skill Naming Convention
- **Design/validation skills**: `apex-{domain}-{action}` (e.g., `apex-design-validator`)
- **Domain expertise skills**: `{domain}-{role}` (e.g., `geo-recommendations-generator`)
- **Test-generated skills**: `{feature-id}-validator` (e.g., `f009-validator`)

### 2. Skill Documentation
Each skill must include:
```typescript
interface SkillDocumentation {
  name: string;
  description: string;
  category: string;
  triggeredWhen: string; // When agent should invoke this skill
  capabilities: string[]; // What this skill can validate/generate
  example: string; // Code example of skill usage
  generatedFrom?: string; // If auto-generated from test
}
```

### 3. Skill Testing
Skills themselves should have tests:
```typescript
// tests/skills/apex-design-validator.test.ts
describe('apex-design-validator skill', () => {
  it('should detect too many accent colors', async () => {
    const badComponent = `
      <div className="bg-[#FF0000] text-[#00FF00] border-[#0000FF]">
        <span className="text-[#FFFF00]">Text</span>
        <span className="bg-[#FF00FF]">More</span>
      </div>
    `;

    const result = await apexDesignValidatorSkill.execute(badComponent, 'secondary-card');
    expect(result.valid).toBe(false);
    expect(result.violations).toContain('Too many colors (5). Max 4 accent colors per view.');
  });

  it('should accept valid component', async () => {
    const goodComponent = `
      <div className="bg-primary text-foreground border-muted">
        <span className="text-success">Text</span>
      </div>
    `;

    const result = await apexDesignValidatorSkill.execute(goodComponent, 'secondary-card');
    expect(result.valid).toBe(true);
  });
});
```

---

## 🎯 Implementation Roadmap

### Phase 1: Core Skills (Week 1)
- [ ] Implement `apex-design-validator` skill
- [ ] Implement `apex-white-label-enforcer` skill
- [ ] Implement `test-spec-skill-generator` skill
- [ ] Create skill registry system
- [ ] Integrate with autonomous agent workflow

### Phase 2: Domain Skills (Week 2)
- [ ] Implement `geo-recommendations-generator` skill
- [ ] Implement `ai-platform-monitor-expert` skill
- [ ] Generate skills for F005-F010 from test specs
- [ ] Test skill invocation in autonomous mode

### Phase 3: Skill Refinement (Week 3)
- [ ] Analyze autonomous agent failures
- [ ] Extract missing rules from failures
- [ ] Update skills with enhanced validation
- [ ] Add auto-fix suggestions to skills

### Phase 4: Skill Reuse & Expansion (Week 4)
- [ ] Build skill library for common patterns
- [ ] Document all skills with examples
- [ ] Create skill discovery system (agent searches skills)
- [ ] Implement skill composition (combine multiple skills)

---

## 🔍 Skill Discovery System

**Problem**: How does agent know which skills to use?

**Solution**: Skill discovery based on feature metadata

```typescript
// skill-discovery.ts
class SkillDiscovery {
  findSkillsForFeature(feature: Feature): Skill[] {
    const relevantSkills: Skill[] = [];

    // 1. Check feature category
    const categorySkills = skillRegistry.findByCategory(feature.category);
    relevantSkills.push(...categorySkills);

    // 2. Check design_reference field
    if (feature.design_reference?.includes('DRIBBBLE_DESIGN_ANALYSIS')) {
      relevantSkills.push(skillRegistry.skills.get('apex-design-validator')!);
    }

    if (feature.design_reference?.includes('WHITE_LABEL_ARCHITECTURE')) {
      relevantSkills.push(skillRegistry.skills.get('apex-white-label-enforcer')!);
    }

    // 3. Check feature name/description keywords
    const keywords = [
      { keyword: 'recommendations', skill: 'geo-recommendations-generator' },
      { keyword: 'monitor', skill: 'ai-platform-monitor-expert' },
      { keyword: 'gauge', skill: 'circular-gauge-expert' },
      { keyword: 'chart', skill: 'chart-color-validator' },
    ];

    for (const { keyword, skill } of keywords) {
      if (feature.name.toLowerCase().includes(keyword) ||
          feature.description.toLowerCase().includes(keyword)) {
        relevantSkills.push(skillRegistry.skills.get(skill)!);
      }
    }

    // 4. Check for feature-specific validator
    const validatorSkill = skillRegistry.skills.get(`${feature.id.toLowerCase()}-validator`);
    if (validatorSkill) {
      relevantSkills.push(validatorSkill);
    }

    return relevantSkills;
  }
}
```

---

## 📊 Success Metrics

### Skill Effectiveness Metrics
1. **Validation Accuracy**: % of violations correctly detected
2. **Auto-Fix Success Rate**: % of violations auto-fixed by skill suggestions
3. **Skill Reuse**: How many features use each skill
4. **Test Pass Rate**: % improvement in first-time test passes with skills

### Target Metrics (3 months)
- **90%+** validation accuracy
- **70%+** auto-fix success rate
- **5+ features** per skill reuse
- **80%+** first-time test pass rate (vs 40% without skills)

---

## 🚀 Next Steps

1. **Immediate** (This week):
   - Create `skills/` directory in Apex project
   - Implement `apex-design-validator` skill
   - Implement `test-spec-skill-generator` skill
   - Generate skill from F004.5 test description

2. **Short-term** (Next 2 weeks):
   - Build skill registry system
   - Integrate skills into autonomous agent workflow
   - Generate skills for all UI features (F005-F010)
   - Document skills with examples

3. **Long-term** (1-3 months):
   - Build comprehensive skill library
   - Implement skill discovery system
   - Add skill composition (combine multiple skills)
   - Create skill analytics dashboard

---

**CRITICAL PRINCIPLE**:
> "Skills are not generic templates - they are project-specific expertise extracted from tests, specs, and design documentation. Every skill must be traceable to a specific requirement in feature_list.json or design docs."

---

**Last Updated**: December 9, 2024
**Version**: 1.0
**Status**: Design Complete, Implementation Pending
