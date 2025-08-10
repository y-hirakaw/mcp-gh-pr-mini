// コメント位置計算のユニットテスト

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
process.env.GITHUB_PERSONAL_ACCESS_TOKEN = 'test-token-123';

// Comment position calculation logic (extracted from source)
function calculateCommentPositions(patch: string): number[] {
  const positions: number[] = [];
  if (patch) {
    let position = 0;
    const lines = patch.split('\n');
    
    for (const line of lines) {
      position++;
      // 追加された行（+で始まる行）の位置を記録
      if (line.startsWith('+') && !line.startsWith('+++')) {
        positions.push(position);
      }
    }
  }
  return positions;
}

// Mock data
const samplePatches = {
  simple: `@@ -1,3 +1,6 @@
 function test() {
-  console.log('old');
+  console.log('new');
+  console.log('added line 1');
+  console.log('added line 2');
 }`,

  multipleHunks: `@@ -1,3 +1,4 @@
 function test() {
   console.log('start');
+  console.log('added in first hunk');
 }
@@ -10,2 +11,4 @@
 function another() {
+  console.log('added in second hunk');
+  console.log('another added line');
   console.log('end');`,

  onlyDeletions: `@@ -1,4 +1,2 @@
 function test() {
-  console.log('to be deleted 1');
-  console.log('to be deleted 2');
   console.log('remaining');
 }`,

  binaryFile: undefined, // No patch for binary files

  emptyPatch: '',

  headerOnly: `diff --git a/test.txt b/test.txt
index 1234567..abcdefg 100644
--- a/test.txt
+++ b/test.txt`
};

describe('Comment Position Calculation', () => {
  describe('calculateCommentPositions', () => {
    it('should find positions of added lines in simple patch', () => {
      const positions = calculateCommentPositions(samplePatches.simple);
      
      // Position 4: +  console.log('new');
      // Position 5: +  console.log('added line 1');
      // Position 6: +  console.log('added line 2');
      expect(positions).toEqual([4, 5, 6]);
    });

    it('should find positions across multiple hunks', () => {
      const positions = calculateCommentPositions(samplePatches.multipleHunks);
      
      // Position 4: +  console.log('added in first hunk');
      // Position 8: +  console.log('added in second hunk');
      // Position 9: +  console.log('another added line');
      expect(positions).toEqual([4, 8, 9]);
    });

    it('should return empty array for patches with only deletions', () => {
      const positions = calculateCommentPositions(samplePatches.onlyDeletions);
      expect(positions).toEqual([]);
    });

    it('should handle undefined patch (binary files)', () => {
      const positions = calculateCommentPositions(samplePatches.binaryFile as any);
      expect(positions).toEqual([]);
    });

    it('should handle empty patch', () => {
      const positions = calculateCommentPositions(samplePatches.emptyPatch);
      expect(positions).toEqual([]);
    });

    it('should handle header-only patch', () => {
      const positions = calculateCommentPositions(samplePatches.headerOnly);
      expect(positions).toEqual([]);
    });

    it('should ignore +++ header lines', () => {
      const patchWithHeaders = `diff --git a/test.txt b/test.txt
index 1234567..abcdefg 100644
--- a/test.txt
+++ b/test.txt
@@ -1,2 +1,3 @@
 existing line
+new line`;

      const positions = calculateCommentPositions(patchWithHeaders);
      // Should not include the +++ header line, only the actual added content
      expect(positions).toEqual([7]); // Position of "+new line"
    });

    it('should handle complex real-world patch', () => {
      const complexPatch = `@@ -15,6 +15,8 @@ export function createServer() {
   server.use(express.json());
   server.use(cors());
   
+  // Add middleware for logging
+  server.use(morgan('combined'));
+  
   server.get('/health', (req, res) => {
     res.json({ status: 'ok' });
   });
@@ -35,4 +37,6 @@ export function createServer() {
   });
   
   return server;
+  
+  // Server configuration complete
 }`;

      const positions = calculateCommentPositions(complexPatch);
      expect(positions).toEqual([5, 6, 7, 15, 16]); // All added lines
    });
  });

  describe('Edge cases', () => {
    it('should handle patch with only context lines', () => {
      const contextOnlyPatch = `@@ -1,3 +1,3 @@
 line 1
 line 2
 line 3`;

      const positions = calculateCommentPositions(contextOnlyPatch);
      expect(positions).toEqual([]);
    });

    it('should handle single character additions', () => {
      const singleCharPatch = `@@ -1,1 +1,2 @@
 existing
++`;

      const positions = calculateCommentPositions(singleCharPatch);
      expect(positions).toEqual([3]); // Position of "++"
    });

    it('should handle patches with mixed line endings', () => {
      const mixedEndingsPatch = "@@ -1,2 +1,3 @@\r\n existing\r\n+added\r\n context";
      
      const positions = calculateCommentPositions(mixedEndingsPatch);
      expect(positions).toEqual([3]); // Position of "+added"
    });
  });

  describe('Integration with file change data', () => {
    it('should work with typical PR file change structure', () => {
      const mockFileChange = {
        filename: 'src/test.ts',
        status: 'modified',
        additions: 3,
        deletions: 1,
        changes: 4,
        patch: samplePatches.simple
      };

      const positions = calculateCommentPositions(mockFileChange.patch);
      
      expect(positions.length).toBeGreaterThan(0);
      expect(positions).toEqual([4, 5, 6]);
      
      // All positions should be valid (positive integers)
      positions.forEach(pos => {
        expect(pos).toBeGreaterThan(0);
        expect(Number.isInteger(pos)).toBe(true);
      });
    });

    it('should handle file with no commentable positions', () => {
      const mockFileChange = {
        filename: 'image.png',
        status: 'added',
        additions: 0,
        deletions: 0,
        changes: 0,
        patch: undefined as any
        // No patch for binary files
      };

      const positions = calculateCommentPositions(mockFileChange.patch);
      expect(positions).toEqual([]);
    });
  });
});