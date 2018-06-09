# require 'pty'
# require 'json'

# stages = ['staging']

# apps = {
#   api: {
#     path: ''
#     cmds: []
#   },
#   console: {
#     path: ''
#     cmds: []
#   }
# }


# #AUTO_ACCEPT_HOST_KEYS = true



# def send_slack_message(app, stage, failed = false)
#   slack_post_url = ""
#   current_username = `whoami`

#   if !(ENV['branch'].nil?)
#     app = "#{app} (Branch: #{ENV['branch']})"
#   end

#   if failed
#     message = "#{app} FAILED to deploy to #{stage} by #{current_username}"
#   else
#     message = "#{app} deployed to #{stage} by #{current_username}"
#   end

#   payload = {
#     channel: "#deployments",
#     username: "AnsibleDeployer",
#     # text: message,
#     icon_emoji: ":ansible:",
#     attachments:[
#         {
#           fallback: message,
#           text: message,
#           color: failed ? "danger" : "good",
#           fields: [
#             {
#               title: "Application",
#               value: "#{app}",
#               short: true
#             },
#             {
#               title: "Environment",
#               value: "#{stage}",
#               short: true
#             }
#           ]

#         }
#       ]
#   }

#   slack_cmd = "curl -X POST --data-urlencode 'payload=#{payload.to_json}' #{slack_post_url}"
#   run_command slack_cmd
# end

# def run_command(cmd, show_stdout=true)
#   puts "[running cmd] #{cmd}"

#   if show_stdout
#     stream_command cmd
#   else
#     `#{cmd}`
#     puts "[exit status] #{$?.exitstatus}"
#     raise "ABORT! Last command failed with exit code: #{$?.exitstatus}" unless $?.exitstatus == 0
#   end

# end

# def stream_command(cmd)
#   PTY.spawn(cmd) do |stdin, stdout, pid|
#     begin
#       stdin.each(' ') do |line|
#         print line

#         if line =~ /yes\/no/ && AUTO_ACCEPT_HOST_KEYS
#           if AUTO_ACCEPT_HOST_KEYS
#             $stdout.puts "Accepting host key automatically. Set AUTO_ACCEPT_HOST_KEYS=false in your Rakefile to disable."
#             stdout.puts "yes"
#           else
#             stdout.puts $stdin.gets
#           end
#         end
#         num_failed = 0
#         result = /failed.*31m(?<num_failed>\d+)/.match(line)
#         if result && result[:num_failed].to_i > 0
#           @failed = true
#         else
#           result = /unreachable.*31m(?<num_failed>\d+)/.match(line)
#           if result && result[:num_failed].to_i > 0
#             @failed = true
#           end
#         end
#       end
#     rescue Errno::EIO
#       puts "Errno:EIO error - no more output"
#     end
#   end
# end


# namespace :deploy do
#   deployable_apps.each do |app|
#     namespace app do
#       stages.each do |stage|
#         desc "deploy #{app} to #{stage} on ECS"
#         task stage do

#           args = "-e target_hosts=tag_#{group}_#{stage} -e rj_env=#{stage} -e feature_branch=#{ENV['branch']} -t deploy --skip-tags provision -v"
#           run_command "#{base_ec2_cmd} playbooks/#{app}/app.yml #{args} #{ENV['extra_args']}"
#           send_slack_message app.capitalize, stage.capitalize, @failed
#         end
#       end

#       desc "deploy #{app} to vagrant"
#       task :vagrant do
#         base_vars = "-t deploy -e target_hosts=vagrant -e rj_env=vagrant -e ansible_sudo_pass=vagrant"
#         base_cmd = "ansible-playbook -i hosts/vagrant -u vagrant"
#         run_command "#{base_cmd} playbooks/#{app}/app.yml #{base_vars} #{ENV['extra_args']}"
#       end
#     end
#   end
# end



# namespace :setup do


#   stages.each do |stage|

#     desc "setup for #{stage} on AWS "
#     task stage => "refresh_cache" do
#       args = "-e target_hosts=tag_api_group_#{stage} -e rj_env=#{stage}"
#       run_command "#{base_ec2_cmd} playbooks/base.yml #{args} #{ENV['extra_args']}"

#       send_slack_message "setup", stage.capitalize, @failed
#     end

#   end

# end

