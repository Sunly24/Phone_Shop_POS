<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CheckPusherConfiguration extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-pusher-configuration';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check if Pusher is properly configured and can connect';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking Pusher Configuration...');

        // Check if Pusher is enabled
        $pusherEnabled = config('broadcasting.default') === 'pusher';
        $this->line('Pusher enabled: ' . ($pusherEnabled ? '<info>Yes</info>' : '<error>No</error>'));

        // Get Pusher configuration
        $pusherConfig = config('broadcasting.connections.pusher');
        
        if (!$pusherConfig) {
            $this->error('Pusher configuration not found in broadcasting config!');
            return 1;
        }

        // Check required configuration keys
        $requiredKeys = ['key', 'secret', 'app_id', 'cluster'];
        $missing = [];
        
        foreach ($requiredKeys as $key) {
            if (empty($pusherConfig[$key])) {
                $missing[] = $key;
            }
        }
        
        if (!empty($missing)) {
            $this->error('Missing required Pusher configuration: ' . implode(', ', $missing));
            return 1;
        }

        // Display configuration details
        $this->info('Pusher Configuration Details:');
        $this->table(
            ['Setting', 'Value'],
            [
                ['App ID', $pusherConfig['app_id']],
                ['Key', $pusherConfig['key']],
                ['Secret', substr($pusherConfig['secret'], 0, 4) . '************'],
                ['Cluster', $pusherConfig['cluster']],
                ['TLS', $pusherConfig['options']['cluster'] ?? 'Not configured'],
                ['Host', $pusherConfig['host'] ?? 'Default'],
                ['Port', $pusherConfig['port'] ?? 'Default'],
                ['Scheme', $pusherConfig['scheme'] ?? 'Default'],
            ]
        );

        // Try to verify connection
        $this->info('Attempting to verify Pusher connection...');
        try {
            $pusher = new \Pusher\Pusher(
                $pusherConfig['key'],
                $pusherConfig['secret'],
                $pusherConfig['app_id'],
                $pusherConfig['options'] ?? []
            );
            
            $result = $pusher->trigger('test-channel', 'test-event', ['message' => 'Testing Pusher connection']);
            
            if ($result) {
                $this->info('Connection to Pusher successful!');
            } else {
                $this->error('Failed to connect to Pusher.');
                return 1;
            }
        } catch (\Exception $e) {
            $this->error('Failed to connect to Pusher: ' . $e->getMessage());
            return 1;
        }

        $this->info('Pusher configuration check completed.');
        return 0;
    }
}
